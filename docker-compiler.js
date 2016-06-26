// npm
var fs = require('fs');
var child_process = require('child_process');
var exec = child_process.exec;

// custom packages
var compilers = require('./supported-compilers');

// constants
var DOCKER_IMAGE = 'compiler';
var CONTAINER_USER_DIR = '/user-files';
var COMPILE_SCRIPT_NAME = 'compile.sh';
var INPUT_FILE_NAME = 'input.txt';

var DockerCompiler = function (lang, code, input, seconds) {
  if (compilers.hasOwnProperty(lang)) {
    this.lang = lang;
    this.code = code;
    this.seconds = seconds;

    var params = compilers[lang];
    this.compiler = params.compiler || '';
    this.filename = params.filename || '';
    this.runtime = params.runtime || '';

    this.input = input;
  } else {
    throw new UnsupportedLanguageException(lang);
  }
};

DockerCompiler.prototype.run = function (callback) {
  var dockerCompiler = this;
  // Create the container
  createContainer(function (containerId) {
    // Copy all the files needed later
    createNeededFilesInContainer(dockerCompiler, containerId, function (err) {
      execute(dockerCompiler, containerId, function (stdout) {
        // Command successful, callback
        callback(stdout);
        // Cleanup the container
        cleanup(containerId, function (err) {
          if (err) {
            console.log('error cleaning up:\n' + err);
          }
        });
      });
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
 * Callback called as `callback(generatedContainerId)`
 */
function createContainer(callback) {
  exec(`docker create -i ${DOCKER_IMAGE}`, function (err, stdout) {
    if (err) {
      console.log('error creating container:\n' + err);
    } else {
      // stdout likes to put \n at the end. take it away via `substring`
      var containerId = stdout.substring(0, stdout.length - 1);
      exec(`docker start ${containerId}`, function (err) {
        if (err) {
          console.log('error starting container:\n' + err);
        }
        callback(containerId);
      });
    }
  });
}

/**
 * Calls back as `callback(err)`
 */
function createNeededFilesInContainer(dockerCompiler, containerId, callback) {
  var scriptWritten = false;
  var sourceWritten = false;
  var inputWritten = false;

  mkdirInContainer(CONTAINER_USER_DIR, containerId, function (err) {
    // Copy the script file
    copyFileToContainer(COMPILE_SCRIPT_NAME, containerId,
        `${CONTAINER_USER_DIR}/${COMPILE_SCRIPT_NAME}`, function (err) {
      if (err) {
        done(err);
      } else {
        // Make the script file executable
        makeFileExecutableInContainer(`${CONTAINER_USER_DIR}/${COMPILE_SCRIPT_NAME}`, containerId,
            function (err) {
          if (!err) {
            scriptWritten = true;
          }
          done(err);
        });
      }
    });

    // Write the source file
    writeFileToContainer(dockerCompiler.code, containerId,
        `${CONTAINER_USER_DIR}/${dockerCompiler.filename}`, function (err) {
      if (!err) {
        sourceWritten = true;
      }
      done(err);
    });

    // Write the input file
    writeFileToContainer(dockerCompiler.input, containerId,
        `${CONTAINER_USER_DIR}/${INPUT_FILE_NAME}`, function (err) {
      if (!err) {
        inputWritten = true;
      }
      done(err);
    });

    // Once all the steps are done or an error occurs, notify via the callback
    function done(err) {
      if (err) {
        callback(err);
      } else if (scriptWritten && sourceWritten && inputWritten) {
        callback();
      }
    };
  });
};

/**
 * Calls back as `callback(err)`
 */
function execute(dockerCompiler, containerId, callback) {
  // Run the compiler and runtime inside the container
  var cmd = `docker exec ${containerId} bash -c`
      + ` 'cd ${CONTAINER_USER_DIR}`
      + ` && ./${COMPILE_SCRIPT_NAME}`
      + ` ${dockerCompiler.seconds}`
      + ` ${dockerCompiler.compiler} ${dockerCompiler.filename}`
      + ` ${INPUT_FILE_NAME} ${dockerCompiler.runtime}'`;
  exec(cmd, function (err, stdout) {
    if (err) {
      console.log('error executing command:\n' + err);
    }
    callback(stdout);
  });
};

/**
 * Calls back as `callback(err)`
 */
function cleanup(containerId, callback) {
  // Kill the container
  exec(`docker kill ${containerId}`, function (err) {
    if (err) {
      callback(err);
    } else {
      // Remove the container
      exec(`docker rm ${containerId}`, function (err) {
        callback(err);
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
