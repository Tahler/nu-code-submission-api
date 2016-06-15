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
 * - "language": A string specifying the language code of the source code. A full list can be found
 *   in another file. // TODO!
 * - "code": A string containing all the source code.
 *
 * Example request using cURL:
 * curl -d '{"language": "c", "code": "xxx"}' -H "Content-Type: application/json" http://domain/code
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
  const jsonReq = req.body;

  if (jsonReq) {
    if (jsonReq.hasOwnProperty('language')
        && jsonReq.hasOwnProperty('code')) {
      const lang = jsonReq.language;
      const code = jsonReq.code;

      res.send('API correct\n'); // TODO use the script, then configure running that in docker
    }
  } else {
    res.sendStatus(400);
  }
});

app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT);
});
