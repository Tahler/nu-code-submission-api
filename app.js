var express = require('express');
var app = express();

var PORT = 8080;

/**
 * Details the Web API for compilation.
 *
 * Requests should be sent to this API as JSON, containing two fields:
 * - "language": A string specifying the language code of the source code. A full list can be found
 *   in another file. // TODO!
 * - "code": A string containing all the source code.
 *
 * Responses are sent as JSON.
 * If the request was correctly formatted, then the JSON response will contain two fields:
 * - "wasSuccess": A boolean: true if the source code successfully compiled. False otherwise.
 * - "output": A string containing the output of the program. If the program failed to compile,
 *   errors are reported here.
 * Otherwise, the JSON response will contain a single field:
 * - "error": A string detailing the error in the request.
 */
app.get('/compile', function (req, res) {
  res.send('Hello World!');
});

app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT);
});
