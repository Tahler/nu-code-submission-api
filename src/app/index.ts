import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Request } from './request';
import { Compilers, langIsSupported } from './supported-compilers';
import { HttpStatusCodes } from './http-status-codes';
import { InvalidRequestError, LanguageUnsupportedError } from './errors';

const Port = 8080;

let app = express();
let jsonParser = bodyParser.json();

// Allow CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if ('OPTIONS' === req.method) {
    res.sendStatus(HttpStatusCodes.Success);
  } else {
    next();
  }
});

// var DockerCompiler = require('./docker-compiler');

// var BadRequestErr;
// (function () {
//   var requiredPropertiesLength = RequiredProperties.length;
//   var propertyOrProperties = requiredPropertiesLength == 1 ? 'property' : 'properties';

//   var list = '';
//   if (requiredPropertiesLength == 1) {
//     list = RequiredProperties[0];
//   } else {
//     // assume greater than 1
//     for (var i = 0; i < requiredPropertiesLength; i++) {
//       if (i > 0) {
//         list += ', ';
//       }
//       if (i == requiredPropertiesLength - 1) {
//         list += 'and '
//       }
//       list += RequiredProperties[i];
//     }
//   }

//   BadRequestErr = {
//     error: `Requests must be sent as JSON containing at least`
//             + ` ${requiredPropertiesLength} ${propertyOrProperties}: ${list}.`
//   };
// })();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Web API
////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * See documentation on usage here:
 * https://github.com/Tahler/capstone-api
 */
app.post('/api', jsonParser, (req, res) => {
  let request: Request = req.body;
  if (Request.hasRequiredProperties(request)) {
    let lang = request.lang;
    if (langIsSupported(request.lang)) {
      res.send('okay!');
    } else {
      res.status(400).send(new LanguageUnsupportedError(lang));
    }
  } else {
    res.status(400).send(new InvalidRequestError(request));
  }
    // // Loaded asynchronously from firebase
    // var seconds;
    // var tests;
    // // Set to true in case of errors in order to stop from sending errors back to the user twice
    // var errorsOccurred = false;

    // // // Get problem info
    // // loadFromFirebase(`/problems/${problemId}/timeout`, function (err, timeout) {
    // //   if (!err) {
    // //     seconds = timeout;
    // //   }
    // //   onDataLoad(err);
    // // });
    // // // Get tests
    // // loadFromFirebase(`/tests/${problemId}`, function (err, testCases) {
    // //   if (!err) {
    // //     tests = testCases;
    // //   }
    // //   onDataLoad(err);
    // // });

    // function onDataLoad(err) {
    //   if (err && !errorsOccurred) {
    //     errorsOccurred = true;
    //     res.status(500).send({ error: err });
    //   } else if (seconds !== undefined && tests !== undefined) {
    //     runInDocker();
    //   }
    // }

    // function runInDocker() {
    //   var dockerCompiler = new DockerCompiler(lang, code, seconds, tests);
    //   dockerCompiler.run(function (result) {
    //     res.status(200).send(result);
    //   });
    // }
});

app.listen(Port, () => console.log(`Listening on port ${Port}`));

export let App = app;
