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
 * - "lang": A string specifying the language code of the source code. A full list can be found
 *   in another file. // TODO!
 * - "src": A string containing all of the source code.
 *
 * Example request using cURL:
 * curl -d '{"lang": "c", "src": ""}' -H "Content-Type: application/json" http://localhost:8080/code
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

  if (reqIsFormattedCorrectly(jsonReq)) {
    const lang = jsonReq.LANGUAGE_CODE_PROPERTY;
    const code = jsonReq.SRC_PROPERTY;

    res.send('Correct\n'); // TODO use the script, then configure running that in docker
  } else {
    const BAD_REQUEST_STATUS_CODE = 400;
    res.sendStatus(BAD_REQUEST_STATUS_CODE);
  }
});

app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT);
});
