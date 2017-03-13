import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';

import { ApiPath, ApiPort, ApiUrl, Port } from './config';
import {
  CompetitionDoesNotExistError,
  CompetitionEndedError,
  CompetitionNotStartedError,
  InvalidRequestError,
  InvalidTokenError,
  NoTokenError,
  ProblemDoesNotExistError
} from './errors';
import { Firebase } from './firebase';
import { HttpStatusCodes } from './http-status-codes';
import { Submission } from './request';
import { Test } from './test';

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
 * To be posted to when a user is newly verified.
 *
 * Retrieves all of that user's successful submissions and moves them to the leaderboard.
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

app.post('/submit', jsonParser, (req, res) => {
  let submission: Submission = req.body;
  submission.submittedOn = new Date().getTime();
  handleSubmission(submission, res);
});

async function handleSubmission(request: Submission, res: express.Response): Promise<void> {
  // Step 1: Validate that the request is properly formatted, problem exists, etc.
  // This does not validate the language
  validateRequest(request).then(
      () => {
        // Step 2: Retreve the needed info from Firebase
        // Load showErrors, timeout, and test cases asynchronously
        let problemLocation = request.competition
            ? `/competitionProblems/${request.competition}/${request.problem}`
            : `/problems/${request.problem}`;
        Promise.all([
          Firebase.get(`${problemLocation}/showErrors`),
          Firebase.get(`${problemLocation}/timeout`),
          Firebase.get(`/tests/${request.problem}`)
        ]).then(
            ([showErrors, timeout, tests]) => {
              // Step 3: Send to the compilation API
              sendToApi(request.lang, request.src, tests, timeout).then(
                result => {
                  // Step 4: Return feedback and record results
                  // Filter out errors if not allowed to show them
                  if (!showErrors && result.message) {
                    // TODO: Google style guide says use result.message = null instead
                    // TODO: but then `message: null` is in the object?
                    delete result.message;
                  }
                  if (request.submitterToken) {
                    Firebase.recordResult(request, result);
                  }
                  res.status(HttpStatusCodes.Success).send(result);
                },
                err => {
                  // Error: either unreachable or bad lang
                  console.error('api err:', err);
                  res.status(err.code).send(err.error);
                }
              );
            },
            err => {
              // Error: Firebase did not resolve info
              // TODO: send unexpected error?
              res.status(HttpStatusCodes.ServerError).send(err);
            });
      },
      err => {
        // Error: Request was poorly validated
        console.error('bad request err:', err);
        res.status(HttpStatusCodes.BadRequest).send(err);
      });
}

/**
 * Throws the first found error. If none are found, returns true.
 * Yeah, I hate this design too.
 */
async function validateRequest(submission: Submission): Promise<boolean> {
  if (!Submission.hasRequiredProperties(submission)) {
    throw new InvalidRequestError(submission);
  }

  let problemId = submission.problem;
  let competitionId = submission.competition;

  let isCompetition = competitionId !== undefined;
  if (isCompetition) {
    let userToken = submission.submitterToken;
    if (userToken === undefined) {
      throw NoTokenError;
    }

    try {
      await Firebase.decodeToken(userToken);
    } catch (err) {
      throw InvalidTokenError;
    }

    let competitionExists = await Firebase.competitionExists(competitionId);
    if (!competitionExists) {
      throw new CompetitionDoesNotExistError(competitionId);
    }

    let competitionHasStarted =
        await Firebase.competitionStartTimeBefore(competitionId, submission.submittedOn);
    if (!competitionHasStarted) {
      throw new CompetitionNotStartedError(competitionId);
    }

    let competitionHasEnded =
        await Firebase.competitionEndTimeAfter(competitionId, submission.submittedOn);
    if (competitionHasEnded) {
      throw new CompetitionEndedError(competitionId);
    }

    let problemExists = await Firebase.competitionProblemExists(competitionId, problemId);
    if (!problemExists) {
      throw new ProblemDoesNotExistError(problemId);
    }
  } else {
    let problemExists = await Firebase.problemExists(problemId);
    if (!problemExists) {
      throw new ProblemDoesNotExistError(problemId);
    }
  }
  return true;
}

/**
 * "Redirects" to the compilation engine.
 */
async function sendToApi(lang: string, src: string, tests: Test[], timeout: number): Promise<any> {
  const Options = {
    hostname: ApiUrl,
    port: ApiPort,
    path: ApiPath,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  return new Promise((resolve, reject) => {
    let req = http.request(Options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        let result = JSON.parse(data);
        if (res.statusCode === 200) {
          resolve(result);
        } else {
          reject({ code: res.statusCode, error: result});
        }
      });
    });
    req.on('error', err => {
      if (err.code === 'EHOSTUNREACH') {
        err = 'The Compilation API is unreachable!';
      }
      reject({ code: HttpStatusCodes.ServerError, error: err});
    });
    req.write(JSON.stringify({ lang, src, tests, timeout }));
    req.end();
  });
}

app.listen(Port, () => console.log(`Submission API listening on port ${Port}`));
