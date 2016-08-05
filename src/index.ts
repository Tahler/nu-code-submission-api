import * as bodyParser from 'body-parser';
import { Promise } from 'es6-promise';
import * as express from 'express';

import {
  FirebasePathDoesNotExistError,
  InvalidRequestError,
  LanguageUnsupportedError,
  NoTokenError,
  ProblemDoesNotExistError,
  UnexpectedError
} from './errors';
import { Firebase } from './firebase';
import { HttpStatusCodes } from './http-status-codes';
import { Request } from './request';
import { Runner } from './runner';
import { langIsSupported } from './supported-languages';

const Port = 8080;

let app = express();
let jsonParser = bodyParser.json();

// Allow CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With');
  if ('OPTIONS' === req.method) {
    res.sendStatus(HttpStatusCodes.Success);
  } else {
    next();
  }
});

/**
 * To be posted when a user is newly verified.
 *
 * Retrieves all of that user's successful submissions and
 */
app.post('/verified', jsonParser, (req, res) => {
  let request = req.body;
  if (request.token) {
    Firebase.moveSuccessfulSubmissionsToLeaderboard(request.token)
        .then(() => res.sendStatus(HttpStatusCodes.Success));
  } else {
    res.status(HttpStatusCodes.BadRequest).send(NoTokenError);
  }
});

/**
 * See documentation on usage here:
 * https://github.com/Tahler/capstone-api/README.md
 */
app.post('/api', jsonParser, (req, res) => {
  let request: Request = req.body;
  request.submittedOn = new Date().toISOString();
  if (Request.hasRequiredProperties(request)) {
    let lang = request.lang;
    if (langIsSupported(request.lang)) {
      handleRequest(request, res);
    } else {
      res.status(HttpStatusCodes.BadRequest).send(new LanguageUnsupportedError(lang));
    }
  } else {
    res.status(HttpStatusCodes.BadRequest).send(new InvalidRequestError(request));
  }
});

function handleRequest(request: Request, res: express.Response) {
  // Retreve the needed info from Firebase
  // Load the timeout and test cases asynchronously
  Promise.all([
    Firebase.get(`/problems/${request.problem}/timeout`),
    Firebase.get(`/tests/${request.problem}`)
  ]).then(
    values => {
      let timeout = values[0];
      let tests = values[1];

      // Ready to execute code
      let runner = new Runner(request.lang, request.src, timeout, tests);
      runner.run().then(
        result => {
          if (request.submitterToken) {
            Firebase.recordResult(request, result);
          }
          res.status(HttpStatusCodes.Success).send(result);
        },
        err => {
          res.status(HttpStatusCodes.ServerError).send(UnexpectedError);
          console.error(err);
        });
    },
    err => {
      if (err instanceof FirebasePathDoesNotExistError) {
        res.status(HttpStatusCodes.BadRequest).send(new ProblemDoesNotExistError(request.problem));
      } else {
        res.status(HttpStatusCodes.ServerError).send(UnexpectedError);
        console.error(err);
      }
    });
}

app.listen(Port, () => console.log(`Listening on port ${Port}`));

export const App = app;
