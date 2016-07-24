// npm
var fs = require('fs');
var child_process = require('child_process');
var exec = child_process.exec;
var spawn = child_process.spawn;

// custom packages
var compilers = require('./supported-compilers');

// constants
var DOCKER_IMAGE = 'compiler';
var CONTAINER_USER_DIR = '/user-files';
var COMPILE_SCRIPT_NAME = 'compile.sh';
var RUN_SCRIPT_NAME = 'run.sh';
var DIFF_SCRIPT_NAME = 'diff.sh';
var INPUT_FILE_NAME_PREFIX = 'input-';
var EXPECTED_OUTPUT_FILE_NAME_PREFIX = 'expected-output-';
var ACTUAL_OUTPUT_FILE_NAME_PREFIX = 'actual-output-';
var TIMEOUT_CODE = 124;

var DIFF_EXPECTED_REGEX = '';
var DIFF_ACTUAL_REGEX = '';
var DIFF_DELIMITER = '======================================================================';

var DockerCompiler = function (lang, code, seconds, tests, shouldReveal) {
  if (compilers.hasOwnProperty(lang)) {
    this.lang = lang;
    this.code = code;
    this.seconds = seconds;
    this.tests = tests;
    this.shouldReveal = shouldReveal;

    var params = compilers[lang];
    this.compiler = params.compiler || '';
    this.filename = params.filename || '';
    this.runtime = params.runtime || '';
  } else {
    throw new UnsupportedLanguageException(lang);
  }
};

DockerCompiler.prototype.isCompiled = function () {
  // !! converts a truthy value to a boolean.
  return !!this.compiler;
};

/**
 * Calls back as callback(result)
 */
DockerCompiler.prototype.run = function (callback) {
  var returnMessage;
  var dockerCompiler = this;

  // Create the container
  startContainer(function (containerId) {
    // Copy all the files needed later
    createNeededFilesInContainer(dockerCompiler, containerId, function (err) {
      if (err) {
        console.error('error copying files to container:\n' + err);
      } else {
        if (dockerCompiler.isCompiled()) {
          compile(dockerCompiler, containerId, function (err, stdout) {
            if (err) {
              callback({
                error: err
              });
            } else {
              // TODO: duplicate code
              runAllTests(dockerCompiler, containerId, function (result) {
                callback(result);
                cleanup(containerId);
              });
            }
          });
        } else {
          // TODO: duplicate code
          runAllTests(dockerCompiler, containerId, function (result) {
            callback(result);
            cleanup(containerId);
          });
        }
      }
    });
  });
};

module.exports = DockerCompiler;

////////////////////////////////////////////////////////////////////////////////////////////////////

function UnsupportedLanguageException(lang) {
  this.name = 'UnsupportedLanguageException';
  this.message = `The language ${lang} is not supported.`;
}

/**
 * Calls back as `callback(generatedContainerId)`
 */
function startContainer(callback) {
  exec(`docker run -d -i ${DOCKER_IMAGE}`, function (err, stdout) {
    if (err) {
      console.error('error starting image ' + err);
    } else {
      // stdout likes to put \n at the end. take it away via `substring`
      var containerId = stdout.substring(0, stdout.length - 1);
      exec(`docker exec ${containerId} cd ${CONTAINER_USER_DIR}`, function (err) {
        callback(containerId);
      });
    }
  });
}

/**
 * Calls back as `callback(err)`
 */
function createNeededFilesInContainer(dockerCompiler, containerId, callback) {
  var compileScriptWritten = false;
  var runScriptWritten = false;
  var sourceWritten = false;
  var testCasesWritten = false;

  mkdirInContainer(CONTAINER_USER_DIR, containerId, function (err) {
    // Copy the compile script if needed
    if (dockerCompiler.isCompiled()) {
      copyScriptToContainer(COMPILE_SCRIPT_NAME, containerId, function (err) {
        if (!err) {
          compileScriptWritten = true;
        }
        done(err);
      });
    } else {
      compileScriptWritten = true;
    }

    // Copy the run script
    copyScriptToContainer(RUN_SCRIPT_NAME, containerId, function (err) {
      if (!err) {
        runScriptWritten = true;
      }
      done(err);
    });

    // Write the source file
    writeFileToContainer(
        dockerCompiler.code,
        containerId,
        `${CONTAINER_USER_DIR}/${dockerCompiler.filename}`,
        function (err) {
      if (!err) {
        sourceWritten = true;
      }
      done(err);
    });

    // Write each of the test cases
    var testCases = dockerCompiler.tests;
    var numTests = testCases.length;
    var numTestsCopied = 0;
    testCases.forEach(function(testCase, i) {
      var input = testCase.input;
      var output = testCase.output;
      var inputSuccess = false;
      var outputSuccess = false;

      function sync(err) {
        if (err) {
          done(err);
        } else if (inputSuccess && outputSuccess) {
          numTestsCopied += 1;
          if (numTestsCopied === numTests) {
            testCasesWritten = true;
            done();
          }
        }
      }
      writeFileToContainer(
          input,
          containerId,
          `${CONTAINER_USER_DIR}/${INPUT_FILE_NAME_PREFIX}${i}`,
          function (err) {
        if (!err) {
          inputSuccess = true;
        }
        sync(err);
      });

      writeFileToContainer(
          output,
          containerId,
          `${CONTAINER_USER_DIR}/${EXPECTED_OUTPUT_FILE_NAME_PREFIX}${i}`,
          function (err) {
        if (!err) {
          outputSuccess = true;
        }
        sync(err);
      });
    });

    // Once all the steps are done or an error occurs, notify via the callback
    function done(err) {
      if (err) {
        callback(err);
      } else if (
          compileScriptWritten
          && runScriptWritten
          && sourceWritten
          && testCasesWritten) {
        callback();
      }
    };
  });
};

/**
 * Calls back as `callback(err, stdout)`
 */
function compile(dockerCompiler, containerId, callback) {
  var fullErr = '';
  var fullStdout = '';
  var cmd = 'docker';
  var args = [
    'exec',
    containerId,
    'bash',
    '-c',
    `cd "${CONTAINER_USER_DIR}" &&`
    + ` "./${COMPILE_SCRIPT_NAME}" "${dockerCompiler.compiler}" "${dockerCompiler.filename}"`
  ];
  var childProcess = spawn(cmd, args);
  childProcess.on('error', function (err) {
    console.error('sorry boss, there was an error starting the compilation command: ' + err);
  });
  childProcess.stdout.on('data', function (data) {
    fullStdout += data;
  });
  childProcess.stderr.on('data', function (data) {
    fullErr += data;
  });
  childProcess.on('close', function (exitCode) {
    callback(fullErr, fullStdout);
  });
}

/**
 * Calls back as `callback(testNumber, err, stdout)` where `stdout` is the output of run.sh
 * Does not return the results of the tests.
 */
function runTest(dockerCompiler, containerId, testNumber, callback) {
  var inputFilename = `${INPUT_FILE_NAME_PREFIX}${testNumber}`;
  var outputFilename = `${ACTUAL_OUTPUT_FILE_NAME_PREFIX}${testNumber}`;

  var cmd = `docker exec ${containerId} bash -c`
      + ` 'cd "${CONTAINER_USER_DIR}"`
      + ` && "./${RUN_SCRIPT_NAME}" "${dockerCompiler.seconds}"`
      + ` "${dockerCompiler.runtime}" "${inputFilename}" "${outputFilename}"'`;
  exec(cmd, function (err, stdout) {
    callback(testNumber, err, stdout)
  });
};

/**
 * Calls back as `callback(finalResult)`
 */
function runAllTests(dockerCompiler, containerId, callback) {
  var finalResult = {};
  var testResults = [];
  var totalExecTime = 0;
  var firstErr;

  var numTests =  dockerCompiler.tests.length;
  var numTestsCompleted = 0;

  for (var i = 0; i < numTests; i++) {
    runTest(dockerCompiler, containerId, i, onTestFinished);
  }

  function onTestFinished(testNumber, err, stdout) {
    var testResult = {};
    if (err) {
      if (err.code === TIMEOUT_CODE) {
        // Err because timeout
        testResult.status = 'timeout';
      } else {
        // Err because runtime error
        testResult.status = 'error';
        testResult.message = stdout;
      }
      if (!firstErr) {
        firstErr = testResult;
      }
      onTestResult(testNumber, testResult);
    } else {
      // See if the test passed by diffing output
      diff(
          dockerCompiler,
          containerId,
          `${EXPECTED_OUTPUT_FILE_NAME_PREFIX}${testNumber}`,
          `${ACTUAL_OUTPUT_FILE_NAME_PREFIX}${testNumber}`,
          function (result) {
        if (result.passed) {
          testResult.status = 'pass';

          var execTime = parseFloat(stdout);
          totalExecTime += execTime;
        } else {
          testResult.status = 'fail';
          testResult.differences = result.differences;
          if (!firstErr) {
            firstErr = { status: 'fail' };
          }
        }
        onTestResult(testNumber, testResult);
      });
    }

    function onTestResult(testNumber, testResult) {
      testResults[testNumber] = testResult;

      numTestsCompleted += 1;
      // If all tests have been ran
      if (numTestsCompleted === numTests) {
        if (firstErr) {
          // Only include the test by test results if shouldReveal is set to true
          if (dockerCompiler.shouldReveal) {
            finalResult.status = firstErr.status;
            finalResult.testResults = testResults;
          } else {
            finalResult = firstErr;
          }
        } else {
          finalResult.status = 'pass';
          finalResult.execTime = totalExecTime;
        }
        callback(finalResult);
      }
    }
  }
}

/**
 * Uses wdiff to compare two files in a container word by word.
 *
 * Calls back as `callback(result)`
 *
 * `result` is an object with two properties: `passed` (boolean) and `differences`.
 *
 * `differences` is an array of objects with two properties each (example:
 * [{expected: '0', actual: '1'}]). An empty array means there were no differences.
 */
function diff(dockerCompiler, containerId, expectedOutputFilename, actualOutputFilename, callback) {
  var fullStdout = '';
  var cmd = 'docker';
  var args = [
    'exec',
    containerId,
    'bash',
    '-c',
    `cd "${CONTAINER_USER_DIR}" &&`
    + ` wdiff -3 "${expectedOutputFilename}" "${actualOutputFilename}" | sed '1d;2d;$d'`
  ];
  var childProcess = spawn(cmd, args);
  childProcess.on('error', function (err) {
    console.error('sorry boss, there was an error diffing: ' + err);
  });
  childProcess.stderr.on('data', function (data) {
    console.error('err received diffing: ' + data);
  });
  childProcess.stdout.on('data', function (data) {
    fullStdout += data;
  });
  childProcess.on('close', function (exitCode) {
    if (exitCode == 0) {
      var result = convertWdiffDataToObject(fullStdout);
      callback(result);
    } else {
      console.error(`docker exec wdiff errored with exit code: ${exitCode}`);
    }
  });
}

/**
 * Returns an object with two properties: `passed` (boolean) and `differences` (array of objects).
 */
function convertWdiffDataToObject(wdiffData) {
  var result = {
    passed: !wdiffData
  };
  if (wdiffData) {
    // Fail
    var differences = [];
    var differentWords = wdiffData.split(DIFF_DELIMITER);
    differentWords.forEach(function (difference) {
      var expected = '';
      var actual = '';
      var expectedMatches = difference.match(/\[-(.*)-\]/);
      if (expectedMatches) {
        expected = expectedMatches[1];
      }
      var actualMatches = difference.match(/{\+(.*)\+}/);
      if (actualMatches) {
        actual = actualMatches[1];
      }
      differences.push({
        expected: expected,
        actual: actual,
      });
    });
    result.differences = differences;
  }
  return result;
}

/**
 * Calls back as `callback(err)`
 */
function cleanup(containerId, callback) {
  // Kill the container
  exec(`docker kill ${containerId}`, function (err) {
    if (err) {
      typeof(callback) == 'function' && callback(err);
    } else {
      // Remove the container
      exec(`docker rm ${containerId}`, function (err) {
        typeof(callback) == 'function' && callback(err);
      });
    }
  });
};

/**
 * Callback same as exec
 */
function mkdirInContainer(dirName, containerId, callback) {
  exec(`docker exec ${containerId} mkdir -p ${dirName}`, callback);
}

/**
 * Callback same as exec
 */
function copyFileToContainer(srcPath, containerId, destPath, callback) {
  exec(`cat ${srcPath} | docker exec -i ${containerId} sh -c 'cat > ${destPath}'`, callback);
}

/**
 * Callback called as `callback(err)`
 */
function writeFileToContainer(data, containerId, destPath, callback) {
  // This is actually impossible (or at least too complicated) because of needed escaping.
  // The alternative: create an intermediate file, call copyFileToContainer, remove the file
  var tmp = require('tmp');
  // Create the tmp filename
  tmp.tmpName(function (err, path) {
    if (err) {
      callback(err);
    } else {
      // Write the data to the tmp file
      fs.writeFile(path, data, function (err) {
        if (err) {
          callback(err);
        } else {
          // Copy the tmp file to a file on the container
          copyFileToContainer(path, containerId, destPath, function (err) {
            // Inform the caller that the data has been sent.
            callback(err);
            // Delete the file
            fs.unlink(path);
          });
        }
      });
    }
  });
}

/**
 * Callback called as `callback(err)`
 */
function makeFileExecutableInContainer(path, containerId, callback) {
  exec(`docker exec ${containerId} chmod a+rwx ${path}`, callback);
}

function copyScriptToContainer(scriptFilename, containerId, callback) {
  copyFileToContainer(
      scriptFilename,
      containerId,
      `${CONTAINER_USER_DIR}/${scriptFilename}`,
      function (err) {
    if (err) {
      callback(err);
    } else {
      // Make the script file executable
      makeFileExecutableInContainer(
          `${CONTAINER_USER_DIR}/${scriptFilename}`,
          containerId,
          callback);
    }
  });
}
