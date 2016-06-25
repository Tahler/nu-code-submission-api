// npm
var fs = require('fs');
var exec = require('child_process').exec;

// custom packages
var compilers = require('./supported-compilers');

// constants
var COPY_DIR = 'user-files';
var CONTAINER_USER_DIR = '/user-files';
var COMPILE_SCRIPT_NAME = 'compile.sh';
var INPUT_FILE_NAME = 'input.txt';
var DOCKER_IMAGE = 'compiler';

function UnsupportedLanguageException(lang) {
  this.name = 'UnsupportedLanguageException';
  this.message = `The language ${lang} is not supported.`;
}

/**
 * Constructor
 */
var DockerCompiler = function (lang, code, input, seconds, workingDir) {
  if (compilers.hasOwnProperty(lang)) {
    this.lang = lang;
    this.code = code;
    this.seconds = seconds;

    this.workingDir = workingDir;

    var params = compilers[lang];
    this.compiler = params.compiler || '';
    this.filename = params.filename || '';
    this.runtime = params.runtime || '';

    this.input = input;
  } else {
    throw new UnsupportedLanguageException(lang);
  }
};

/**
 * Creates the necessary files for execution.
 */
DockerCompiler.prototype.createFiles = function (callback) {
  // TODO: address errors
  // TODO: try to allow async, everything needs to be done before running, however
  var dockerCompiler = this;

  // Create the folder with copied contents
  var cmd = `cp ${COPY_DIR} ${this.workingDir} -r`;
  exec(cmd, function (err) {
    // Write the source code to a file in the working directory
    fs.writeFile(
        `${dockerCompiler.workingDir}/${dockerCompiler.filename}`,
        dockerCompiler.code,
        function (err) {
      // Write the input to a file in the working directory
      fs.writeFile(
          `${dockerCompiler.workingDir}/${INPUT_FILE_NAME}`,
          dockerCompiler.input,
          function(err) {
        // Allow the chain to continue via the callback function
        callback();
      });
    });
  });
};

/**
 * Requires the necessary files to have been created beforehand.
 */
DockerCompiler.prototype.execute = function (callback) {
  var cmd = `docker run --rm`
      // volume to run in
      // TODO: fix this pwd crap?
      + ` -v "\`pwd\`/${this.workingDir}":${CONTAINER_USER_DIR}`
      + ` -w ${CONTAINER_USER_DIR}`
      // the image to run
      + ` ${DOCKER_IMAGE}`
      // command to run inside docker container
      + ` ./${COMPILE_SCRIPT_NAME}`
      // parameters for command
      + ` "${this.seconds}" "${this.compiler}" "${this.filename}" "${INPUT_FILE_NAME}"`
      + ` "${this.runtime}"`;
  exec(cmd, function (err, stdout, stderr) {
    callback(stdout);
  });
};

DockerCompiler.prototype.cleanup = function (callback) {
  var cmdRemoveWorkingDir = `rm ${this.workingDir} -rf`;
  exec(cmdRemoveWorkingDir);

  // // Already removed via the docker run --rm
  // var cmdRemoveExitedContainers = `docker ps -a | grep Exit | cut -d ' ' -f 1 | xargs docker rm`;
  // exec(cmdRemoveExitedContainers);
};

DockerCompiler.prototype.run = function (callback) {
  var dockerCompiler = this;
  dockerCompiler.createFiles(function () {
    dockerCompiler.execute(function (stdout) {
      callback(stdout);
      dockerCompiler.cleanup();
    });
  });
};

module.exports = DockerCompiler;
