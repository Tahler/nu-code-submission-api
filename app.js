const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const compilers = require('./compilers').compilers;

const PORT = 8080;

/**
 * Details the Web API for compilation.
 *
 * Requests should be sent to this API as a post request containing JSON with two fields:
 * - "lang": A string specifying the language code of the source code. A full list can be found in
 *   the properties of compilers.js.
 * - "src": A string containing all of the source code.
 *
 * Example request using cURL:
 * curl -d '{"lang": "c", "src": "#include <stdio.h>\n\nint main()\n{\n  printf(\"Hello, world!\");\n}"}' -H "Content-Type: application/json" http://localhost:8080/code
 *
 * Responses are sent as JSON.
 * If the request was correctly formatted, then the JSON response will contain two fields:
 * - "wasSuccess": A boolean: true if the source code successfully compiled. False otherwise.
 * - "output": A string containing the output of the program. If the program failed to compile,
 *   errors are reported here.
 * Otherwise, the JSON response will contain a single field:
 * - "error": A string detailing the error in the request.
 */
app.post('/code', jsonParser, function (req, res) {
  const LANGUAGE_CODE_PROPERTY = 'lang';
  const SRC_PROPERTY = 'src';
  const jsonReq = req.body;

  function reqIsFormattedCorrectly(req) {
    return req
      && req.hasOwnProperty(LANGUAGE_CODE_PROPERTY)
      && req.hasOwnProperty(SRC_PROPERTY);
  }

  function langIsSupported(lang) {
    return compilers.hasOwnProperty(lang);
  }

  if (reqIsFormattedCorrectly(jsonReq)) {
    const lang = jsonReq[LANGUAGE_CODE_PROPERTY];
    const code = jsonReq[SRC_PROPERTY];
    if (langIsSupported(lang)) {
      execute(lang, code);
    } else {
      const langUnsupportedErr = '{ "error": "Language ' + lang + ' is unsupported." }\n';
      res.send(langUnsupportedErr);
    }
  } else {
    const badRequestErr = '{ "error": "Requests must be sent as JSON containing two fields: \\"lang\\" and \\"src\\"." }\n';
    res.send(badRequestErr);
  }
});

function writeToFile(filename, buffer) {
  const fs = require('fs');
  fs.writeFile(filename, buffer); // TODO: errors here?
}

function execute(lang, code) {
  const parameters = compilers[lang];
  const filename = parameters[1];
  writeToFile(filename, code);

  const exec = require('child_process').exec;

  const cmd = './compile.sh ' + parameters.join(' ');
  exec(cmd, function (error, stdout, stderr) {
    console.log('error:' + error);
    console.log('out:' + stdout);
    console.log('err:' + stderr);
  });
}

app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT);
});
