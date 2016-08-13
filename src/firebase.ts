import { Promise } from 'es6-promise';
import * as firebase from 'firebase';

import { FirebasePathDoesNotExistError } from './errors';
import { Request } from './request';
import { Result, SuccessfulSubmission, UserSubmission } from './results';

// Relative to where Node is run from
const ServiceCredentialsPath = './credentials/server-credentials.json';
const DatabaseUrl = 'https://nu-code-350ea.firebaseio.com';
const ServiceUid = 'compilation-api';

firebase.initializeApp({
  databaseAuthVariableOverride: {
    uid: ServiceUid
  },
  databaseURL: DatabaseUrl,
  serviceAccount: ServiceCredentialsPath
});

let database = firebase.database();

export namespace Firebase {
  export async function get(path: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      database.ref(path).once('value').then(
        snapshot => {
          if (snapshot.exists()) {
            resolve(snapshot.val());
          } else {
            reject(new FirebasePathDoesNotExistError(path));
          }
        },
        // Pass on the error to the caller
        err => reject(err));
    });
  }

  /**
   * If the path does not exist, resolve with defaultValue
   */
  export async function getOrDefault(path: string, defaultValue: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      database.ref(path).once('value').then(
        snapshot => {
          if (snapshot.exists()) {
            resolve(snapshot.val());
          } else {
            resolve(defaultValue);
          }
        },
        // Pass on the error to the caller
        err => reject(err));
    });
  }

  export async function set(path: string, value): Promise<void> {
    return database.ref(path).set(value);
  }

  async function decodeToken(token: string): Promise<any> {
    return firebase.auth().verifyIdToken(token);
  }

  async function recordForUser(uid: string, problemId: string, submission: any): Promise<void> {
    return database.ref(`/submissions/${uid}/${problemId}`)
        .push(submission);
  }

  async function recordToLeaderboard(problemId: string, submission: any): Promise<void> {
    return database.ref(`/successfulSubmissions/${problemId}`)
        .push(submission);
  }

  async function recordProblemResult(
      uid: string,
      emailVerified: boolean,
      request: Request,
      result: Result): Promise<void> {
    let actions: Promise<void>[] = [];

    let problemId = request.problem;
    let userSubmission: UserSubmission = {
      status: result.status,
      submittedOn: request.submittedOn,
      lang: request.lang
    };
    if (result.status === 'Pass') {
      userSubmission.execTime = result.execTime;

      if (emailVerified) {
        let successfulSubmission: SuccessfulSubmission = {
          execTime: result.execTime,
          lang: request.lang,
          submittedOn: request.submittedOn,
          submitterUid: uid
        };
        // Record for the leaderboard (but only if they passed)
        let leaderboardPromise = recordToLeaderboard(problemId, successfulSubmission);
        leaderboardPromise.catch(err => console.error(`Failed to add to leaderboard: ${err}`));
        actions.push(leaderboardPromise);
      }
    }

    // Record for the user
    let userRecording = recordForUser(uid, problemId, userSubmission);
    userRecording.catch(err => console.error(`Failed to record user's submission: ${err}`));
    actions.push(userRecording);
    // Promise resolves when all actions finish
    return allActions(actions);
  }

  async function recordCompetitionResult(
      uid: string,
      emailVerified: boolean,
      request: Request,
      result: Result): Promise<void> {
    let action: Promise<void>;

    const competitionId = request.competition;
    const problemId = request.problem;
    const competitionPath = `/competitions/${competitionId}`;
    const competitionProblemPath = `/competitionProblems/${competitionId}/${problemId}`;
    const competitionScoreboardPath = `/competitionScoreboards/${competitionId}/${uid}`;
    const competitionScoreboardProblemPath = `${competitionScoreboardPath}/problems/${problemId}`;

    // Add 1 to incorrect or set incorrect to 1
    let incorrectSubmissions = await getOrDefault(
        `${competitionScoreboardProblemPath}/incorrectSubmissions`, 0);

    if (result.status === 'Pass') {
      // Set submittedOn
      let submittedOn = request.submittedOn;
      let startTime = await get(`${competitionPath}/startTime`);
      let solutionTime = submittedOn - startTime;

      let penaltySeconds = await get(`${competitionProblemPath}/penalty`);
      let penaltyMilliseconds = penaltySeconds * 1000;
      let penaltySum = incorrectSubmissions * penaltyMilliseconds;

      let timeIncrease = solutionTime + penaltySum;

      action = allActions([
        incrementUserScore(competitionScoreboardPath, timeIncrease),
        set(`${competitionScoreboardProblemPath}/solutionSubmittedAfter`,
            solutionTime)
      ]);
    } else {
      // Increase the number of incorrect submissions
      action = set(
          `${competitionScoreboardProblemPath}/incorrectSubmissions`,
          incorrectSubmissions + 1);
    }

    return action;
  }

  /**
   * Increases the number of correct problems and increases the time score
   */
  async function incrementUserScore(pathToUser: string, timeIncrease: number): Promise<void> {
    let currentProblemsSolved = await getOrDefault(`${pathToUser}/problemsSolved`, 0);
    let currentTimeScore = await getOrDefault(`${pathToUser}/timeScore`, 0);
    let newProblemsSolved = currentProblemsSolved + 1;
    let newTimeScore = currentTimeScore + timeIncrease;
    // The index helps with querying firebase, and provides a sneaky way of ordering primarily by
    // problemsSolved, and then by timeScore
    let newIndex = currentProblemsSolved + '|' + currentTimeScore;

    return allActions([
      set(`${pathToUser}/index`, newIndex),
      set(`${pathToUser}/problemsSolved`, newProblemsSolved),
      set(`${pathToUser}/timeScore`, newTimeScore)
    ]);
  }

  export async function recordResult(request: Request, result: Result): Promise<void> {
    // Decode the uid from the token
    return decodeToken(request.submitterToken).then(token => {
      let uid = token.uid;
      let emailVerified = token.email_verified;

      return request.competition
          ? recordCompetitionResult(uid, emailVerified, request, result)
          : recordProblemResult(uid, emailVerified, request, result);
    });
  }

  export async function moveSuccessfulSubmissionsToLeaderboard(token: string): Promise<void> {
    return decodeToken(token).then(user => {
      let uid = user.uid;
      database.ref(`/submissions/${uid}`).once('value', snapshot => {
        let moves: Promise<void>[] = [];
        if (snapshot.exists()) {
          let allProblems = snapshot.val();
          // Loop through all the problems the user has submitted to
          for (let problemId in allProblems) {
            if (allProblems.hasOwnProperty(problemId)) {
              let problemSubmissions = allProblems[problemId];
              // Loop through all the submissions to this problem
              for (let submissionId in problemSubmissions) {
                if (problemSubmissions.hasOwnProperty(submissionId)) {
                  let submission = problemSubmissions[submissionId];
                  if (submission.status === 'Pass') {
                    let move = moveToLeaderboard(problemId, uid, submission);
                    moves.push(move);
                  }
                }
              }
            }
          }
        }
        return Promise.all(moves);
      });
    });
  }

  async function moveToLeaderboard(
      problemId: string,
      uid: string,
      submission: UserSubmission): Promise<void> {
    let successfulSubmission: SuccessfulSubmission = {
      lang: submission.lang,
      execTime: submission.execTime,
      submitterUid: uid,
      submittedOn: submission.submittedOn
    };
    return database.ref(`successfulSubmissions/${problemId}`).push(successfulSubmission);
  }

  async function allActions(actions: Promise<void>[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Mapping from void[] to void
      Promise.all(actions).then(
          () => resolve(),
          err => reject(err));
    });
  }
}
