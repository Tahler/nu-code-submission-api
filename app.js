const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const compilers = require('./compilers').compilers;

const PORT = 8080;

/**
 * Details the Web API for compilation.
 *
 * Requests should be sent to this API as a post request containing JSON with three fields:
 * - "lang": A string specifying the language code of the source code. A full list can be found in
 *   the properties of compilers.js.
 * - "src": A string containing all of the source code.
 * - "seconds": A number specifying the amount of seconds before a timeout is reported.
 *
 * Example request using cURL:
 * curl -d '{"lang": "c", "src": "#include <stdio.h>\n\nint main()\n{\n  printf(\"Hello, world!\");\n}", "seconds": 10}' -H "Content-Type: application/json" http://localhost:8080/code
 *
 * Responses are sent as JSON.
 * If the request was correctly formatted, then the JSON response will contain two properties:
 * - "status": A string:
 *    - "success" if the source code successfully compiled and ran.
 *    - "error" if the source code contained errors.
 *    - "timeout" if the time length specified in seconds was exceeeded.
 * - "output": A string containing the output of the program. If the program failed to compile,
 *   errors are reported here.
 * Otherwise, the JSON response will contain a single property:
 * - "error": A string detailing the error in the request.
 */
app.post('/code', jsonParser, function (req, res) {
  const LANGUAGE_CODE_PROPERTY = 'lang';
  const SRC_PROPERTY = 'src';
  const TIMEOUT_PROPERTY = 'seconds';

  const jsonReq = req.body;

  function reqHasRequiredFields(req) {
    return req
      && req.hasOwnProperty(LANGUAGE_CODE_PROPERTY)
      && req.hasOwnProperty(SRC_PROPERTY)
      && req.hasOwnProperty(TIMEOUT_PROPERTY);
  }

  function langIsSupported(lang) {
    return compilers.hasOwnProperty(lang);
  }

  if (reqHasRequiredFields(jsonReq)) {
    const lang = jsonReq[LANGUAGE_CODE_PROPERTY];
    const code = jsonReq[SRC_PROPERTY];
    const seconds = jsonReq[TIMEOUT_PROPERTY];

    if (seconds > 0) {
      if (langIsSupported(lang)) {
        // Request can be executed.
        execute(lang, code, seconds, function (result) {
          res.send(result);
        });
      } else {
        const langUnsupportedErr = '{"error": "Language ' + lang + ' is unsupported."}\n';
        res.send(langUnsupportedErr);
      }
    } else {
      const negSecondsErr = '{"error": "The \\"seconds\\" property must be positive."}\n';
      res.send(negSecondsErr);
    }
  } else {
    const badRequestErr = '{"error": "Requests must be sent as JSON containing three properties: \\"lang\\", \\"src\\" and \\"seconds\\"."}\n';
    res.send(badRequestErr);
  }
});

function writeToFile(filename, buffer, callback) {
  const fs = require('fs');
  fs.writeFile(filename, buffer, function () {
    callback();
  });
}

function execute(lang, code, seconds, callback) {
  const parameters = compilers[lang];
  const filename = parameters[1];

  writeToFile(filename, code, function () {
    const exec = require('child_process').exec;

    const cmd = './compile.sh ' + seconds + ' ' + parameters.join(' ');
    exec(cmd, function (error, stdout, stderr) {
      callback(stdout);
    });
  });
}

app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
});
