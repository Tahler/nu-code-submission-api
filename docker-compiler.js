// npm
const fs = require('fs');
const exec = require('child_process').exec;

// custom packages
const compilers = require('./supported-compilers');

// constants
const COPY_DIR = 'user-files';
const CONTAINER_USER_DIR = '/user-files';
const INPUT_FILE_NAME = 'input.txt';
const COMPILE_SCRIPT_NAME = 'compile.sh';
const DOCKER_CONTAINER_NAME = 'compiler';

function UnsupportedLanguageException(lang) {
  this.name = 'UnsupportedLanguageException';
  this.message = `The language ${lang} is not supported.`;
}

/**
 * Constructor
 */
const DockerCompiler = function (lang, code, seconds, workingDir, stdin) {
  if (langIsSupported(lang)) {
    this.lang = lang;
    this.code = code;
    this.seconds = seconds;

    this.workingDir = workingDir;

    const params = compilers[lang];
    this.compiler = params.compiler || '';
    this.filename = params.filename || '';
    this.runtime = params.runtime || '';

    this.stdin = stdin;
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

  // Create the folder with copied contents
  let cmd = `cp ${COPY_DIR} ${this.workingDir} -r`;
  exec(cmd, function (err) {
    // Write the source code to a file in the working directory
    fs.writeFile(
        `${dockerCompiler.workingDir}/${dockerCompiler.filename}`,
        dockerCompiler.code,
        function (err) {
      // Write the stdin to a file in the working directory
      fs.writeFile(
          `${dockerCompiler.workingDir}/${INPUT_FILE_NAME}`,
          dockerCompiler.stdin,
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
  let cmd = `docker run ${DOCKER_CONTAINER_NAME}`
    // volume to run in
    + ` -v ${this.workingDir}:${CONTAINER_USER_DIR}`
    // command to run inside docker container
    + ` ${CONTAINER_USER_DIR}/${COMPILE_SCRIPT_NAME}`
    // parameters for command
    + ` ${this.seconds}s ${this.compiler} ${this.filename} ${this.runtime}`;
  exec(cmd, function (err, stdout, stderr) {
    callback(stdout);
  });
};

DockerCompiler.prototype.cleanup = function (callback) {
  let cmdRemoveWorkingDir = `rm ${workingDir} -rf`;
  exec(cmdRemoveWorkingDir);

  let cmdRemoveExitedContainers = `docker ps -a | grep Exit | cut -d ' ' -f 1 | xargs docker rm`;
  exec(cmdRemoveExitedContainers);
};

DockerCompiler.prototype.run = function (callback) {
  const dockerCompiler = this;
  createFiles(function () {
    execute(function (stdout) {
      callback(stdout);
      dockerCompiler.cleanup();
    });
  });
};

module.exports = DockerCompiler;
