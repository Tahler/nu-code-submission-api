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
  export function get(path: string): Promise<any> {
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

  export function recordResult(request: Request, result: Result): Promise<void> {
    let actions: Promise<void>[] = [];

    let userSubmission: UserSubmission = {
      status: result.status,
      submittedOn: request.submittedOn,
      lang: request.lang
    };
    if (userSubmission.status === 'Pass') {
      userSubmission.execTime = result.execTime;

      let successfulSubmission: SuccessfulSubmission = {
        status: result.status,
        execTime: result.execTime,
        submittedOn: request.submittedOn,
        submitterUid: request.submitterUid
      };
      // Record for the leaderboard (but only if they passed)
      console.log(userSubmission);
      console.log(successfulSubmission);

      let leaderboardRecord = database.ref(`/problems/${request.problem}/successfulSubmissions`)
        .push(successfulSubmission);
      leaderboardRecord.catch(
          err => console.error(`Failed to record submission to leaderboard: ${err}`));
      actions.push(leaderboardRecord);
    }

    // Record for the user
    let userRecording = database.ref(`/submissions/${request.submitterUid}/${request.problem}`)
      .push(userSubmission);
    userRecording.catch(
        err => console.error(`Failed to record user's submission: ${err}`));
    actions.push(userRecording);

    // Promise resolves when all actions finish
    return new Promise<void>((resolve, reject) => {
      // Mapping from void[] to void
      Promise.all(actions).then(
        () => resolve(),
        err => reject(err));
    });
  }
}
