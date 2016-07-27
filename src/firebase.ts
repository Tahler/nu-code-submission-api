import { Promise } from 'es6-promise';
import * as firebase from 'firebase';

// TODO: Relative to where Node is run from
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
            reject(`${path} does not exist.`);
          }
        },
        // Pass on the error to the caller
        err => reject(err));
    });
  }
}
