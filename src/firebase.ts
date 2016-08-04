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

  function recordForUser(uid: string, problemId: string, submission: any): Promise<void> {
    return database.ref(`/submissions/${uid}/${problemId}`)
        .push(submission);
  }

  function recordToLeaderboard(problemId: string, submission: any): Promise<void> {
    return database.ref(`/successfulSubmissions/${problemId}`)
        .push(submission);
  }

  export function recordResult(request: Request, result: Result): Promise<void> {
    let actions: Promise<void>[] = [];

    let problemId = request.problem;

    // Decode the uid from the token
    return firebase.auth().verifyIdToken(request.submitterToken).then(token => {
      let uid = token.uid;
      let emailVerified = token.email_verified;

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
      return new Promise<void>((resolve, reject) => {
        // Mapping from void[] to void
        Promise.all(actions).then(
            () => resolve(),
            err => reject(err));
      });
    });
  }
}
