var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var compilers = require('./supported-compilers');
var DockerCompiler = require('./docker-compiler');

var PORT = 8080;

var LANG_PROPERTY = 'lang';
var SRC_PROPERTY = 'src';
var TIMEOUT_PROPERTY = 'seconds';
var STDIN_PROPERTY = 'stdin';
var REQUIRED_PROPERTIES = [LANG_PROPERTY, SRC_PROPERTY];
var BAD_REQUEST_ERR = (function () {
  var requiredPropertiesLength = REQUIRED_PROPERTIES.length;
  var propertyOrProperties = requiredPropertiesLength == 1 ? 'property' : 'properties';

  var list = '';
  if (requiredPropertiesLength == 1) {
    list = REQUIRED_PROPERTIES[0];
  } else {
    // assume greater than 1
    for (var i = 0; i < requiredPropertiesLength; i++) {
      list += ', ';
      if (i == requiredPropertiesLength - 1) {
        list += 'and '
      }
      list += REQUIRED_PROPERTIES[i];
    }
  }

  return `Requests must be sent as JSON containing at least ${requiredPropertiesLength} `
    + `${propertyOrProperties}: ${list}."`;
})();
var DEFAULT_TIMEOUT_SECONDS = 600;
var DEFAULT_STDIN = '';

// The dir count is appended to this
var WORKING_DIR_PREFIX = 'user-files';
var MAX_DIR_COUNT = 1000;

// Incremented with each compilation request
var dirCount = 0;

/**
 * Details the Web API for compilation.
 *
 * Requests should be sent to this API as a post request containing JSON with at least the following
 * two fields:
 * - "lang": A string specifying the language code of the source code. A full list can be found in
 *   the properties of compilers.js.
 * - "src": A string containing all of the source code.
 * The next two fields are optional, and will be defaulted if not specified directly:
 * - "seconds": A number specifying the amount of seconds before a timeout is reported. The default
 *   is 10 minutes (600 seconds).
 * - "stdin": A string containing all of the input to be directed into the program.
 *
 * Example request using cURL:
 * curl -d '{"lang": "c", "src": "#include <stdio.h>\n\nint main()\n{\n  printf(\"Hello, world!\");\n}"}' -H "Content-Type: application/json" http://localhost:8080/api
 *
 * Responses are sent as JSON.
 * If the request was correctly formatted, then the JSON response will contain two properties:
 * - "status": A string acting as an enum:
 *   - "success" if the source code successfully compiled and ran.
 *   - "error" if the source code contained errors.
 *   - "timeout" if the time length specified in seconds was exceeeded.
 * - "output": A string containing the output of the program. If the program failed to compile,
 *   errors are reported here.
 * Otherwise, the JSON response will contain a single property:
 * - "error": A string detailing the error in the request.
 */
app.post('/api', jsonParser, function (req, res) {
  var jsonReq = req.body;

  if (hasRequiredProperties(jsonReq, REQUIRED_PROPERTIES)) {
    var lang = jsonReq[LANG_PROPERTY];
    var code = jsonReq[SRC_PROPERTY];

    var seconds = jsonReq[TIMEOUT_PROPERTY] || DEFAULT_TIMEOUT_SECONDS;
    var stdin = jsonReq[STDIN_PROPERTY] || DEFAULT_STDIN;

    if (seconds > 0) {
      try {
        // Create unique folder for user
        var currentUserNumber = dirCount;
        dirCount += 1;
        if (dirCount > MAX_DIR_COUNT) {
          dirCount = 0;
        }
        var workingDir = WORKING_DIR_PREFIX + String(currentUserNumber);

        var dockerCompiler = new DockerCompiler(lang, code, stdin, seconds, workingDir);
        dockerCompiler.run(function (stdout) {
          res.send(stdout);
        });
      } catch (err) {
        var jsonErr = `{"error": "${err.message}"}\n`;
        res.send(jsonErr);
      }
    } else {
      var negSecondsErr = '{"error": "The seconds property must be positive."}\n';
      res.send(negSecondsErr);
    }
  } else {
    var badRequestErr = `{"error": "${BAD_REQUEST_ERR}"}\n`;
    res.send();
  }
});

function hasRequiredProperties(obj, properties) {
  var hasRequiredProperties = true;
  for (var i = 0; i < properties.length; i++) {
    if (!obj.hasOwnProperty(properties[i])) {
      hasRequiredProperties = false;
      break;
    }
  }
  return hasRequiredProperties;
}

app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
});
