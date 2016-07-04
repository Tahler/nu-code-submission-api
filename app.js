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
var TESTS_PROPERTY = 'tests';
var REQUIRED_PROPERTIES = [LANG_PROPERTY, SRC_PROPERTY];
var BAD_REQUEST_ERR;
(function () {
  var requiredPropertiesLength = REQUIRED_PROPERTIES.length;
  var propertyOrProperties = requiredPropertiesLength == 1 ? 'property' : 'properties';

  var list = '';
  if (requiredPropertiesLength == 1) {
    list = REQUIRED_PROPERTIES[0];
  } else {
    // assume greater than 1
    for (var i = 0; i < requiredPropertiesLength; i++) {
      if (i > 0) {
        list += ', ';
      }
      if (i == requiredPropertiesLength - 1) {
        list += 'and '
      }
      list += REQUIRED_PROPERTIES[i];
    }
  }

  BAD_REQUEST_ERR = `Requests must be sent as JSON containing at least ${requiredPropertiesLength} `
    + `${propertyOrProperties}: ${list}.`;
})();
var DEFAULT_TIMEOUT_SECONDS = 10;
var DEFAULT_INPUT = '';

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
 * - "tests": An array of test case objects containing two properties:
 *   - "input": The input string to be fed into the program
 *   - "output": The expected string output
 *
 * Example request using cURL:
 * curl -d '{"lang": "c", "src": "#include <stdio.h>\n\nint main()\n{\n  printf(\"Hello, world!\");\n}"}' -H "Content-Type: application/json" http://localhost:8080/api
 *
 * JSON examples
 * {
 *  "lang": "java",
 *  "src": "import java.util.Scanner; public class Solution { public static void main(String[] args) { Scanner scanner = new Scanner(System.in); int x = scanner.nextInt(); int y = x * 2; System.out.println(y); } }",
 *  "seconds": 4,
 *  "tests": [
 *    {"input": "0", "output": "0"},
 *    {"input": "1", "output": "2"},
 *    {"input": "-4", "output": "-8"},
 *    {"input": "80", "output": "160"}
 *  ]
 * }
 *
 * Responses are sent as JSON.
 * If the request was correctly formatted, then the JSON response will contain two properties:
 * - "status": A string acting as an enum:
 *   - "pass" if the source code successfully compiled / ran and passed all tests.
 *   - "fail" if the source code successfully compiled / ran but did not pass all tests.
 *   - "error" if the source code contained errors.
 *   - "timeout" if the time length specified in seconds was exceeeded.
 * - "output": A string containing the results. If the program failed to compile,
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
    var tests = jsonReq[TESTS_PROPERTY];

    if (seconds > 0) {
      var dockerCompiler = new DockerCompiler(lang, code, seconds, tests);
      dockerCompiler.run(function (stdout) {
        res.send(stdout);
      });
    } else {
      var negSecondsErr = '{"error": "The seconds property must be positive."}\n';
      res.send(negSecondsErr);
    }
  } else {
    var badRequestErr = `{"error": "${BAD_REQUEST_ERR}"}\n`;
    res.send(badRequestErr);
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
