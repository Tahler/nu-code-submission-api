import * as bodyParser from 'body-parser';
import { Promise } from 'es6-promise';
import * as express from 'express';

import {
  CompetitionDoesNotExistError,
  CompetitionEndedError,
  CompetitionNotStartedError,
  InvalidRequestError,
  LanguageUnsupportedError,
  NoTokenError,
  ProblemDoesNotExistError
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
 * Retrieves all of that user's successful submissions and moves them to
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
  request.submittedOn = new Date().getTime();
  handleRequest(request, res);
});

/**
 * Throws error if any are found. Returns true if valid.
 * I hate this design.
 */
async function validateRequest(request: Request): Promise<boolean> {
  if (!Request.hasRequiredProperties(request)) {
    throw new InvalidRequestError(request);
  }
  if (!langIsSupported(request.lang)) {
    throw new LanguageUnsupportedError(request.lang);
  }

  let problemId = request.problem;
  let competitionId = request.competition;

  if (competitionId === undefined) {
    let problemExists = await Firebase.problemExists(problemId);
    if (!problemExists) {
      throw new ProblemDoesNotExistError(problemId);
    }
  } else {
    let competitionExists = await Firebase.competitionExists(competitionId);
    if (!competitionExists) {
      throw new CompetitionDoesNotExistError(competitionId);
    }

    let competitionHasStarted =
        await Firebase.competitionStartTimeBefore(competitionId, request.submittedOn);
    if (!competitionHasStarted) {
      throw new CompetitionNotStartedError(competitionId);
    }

    let competitionHasEnded =
        await Firebase.competitionEndTimeAfter(competitionId, request.submittedOn);
    if (competitionHasEnded) {
      throw new CompetitionEndedError(competitionId);
    }

    let problemExists = await Firebase.competitionProblemExists(competitionId, problemId);
    if (!problemExists) {
      throw new ProblemDoesNotExistError(problemId);
    }
  }

  return true;
}

async function handleRequest(request: Request, res: express.Response): Promise<void> {
  try {
    // This will throw errors if not valid.
    await validateRequest(request);
    // Retreve the needed info from Firebase
    // Load the timeout and test cases asynchronously
    let timeoutLocation = request.competition
        ? `/competitionProblems/${request.competition}/${request.problem}/timeout`
        : `/problems/${request.problem}/timeout`;
    let [timeout, tests] = await Promise.all([
      Firebase.get(timeoutLocation),
      Firebase.get(`/tests/${request.problem}`)
    ]);
    // Ready to execute code
    let runner = new Runner(request.lang, request.src, timeout, tests);
    let result = await runner.run();
    if (request.submitterToken) {
      Firebase.recordResult(request, result);
    }
    res.status(HttpStatusCodes.Success).send(result);
  } catch (err) {
    res.status(HttpStatusCodes.BadRequest).send(err);
  }
}

app.listen(Port, () => console.log(`Listening on port ${Port}`));

export const App = app;
