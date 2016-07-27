import * as firebase from 'firebase';
import { Observable } from 'rxjs';

const ServiceCredentialsPath = '../credentials/nu-code-server.json';
const DatabaseUrl = 'https://nu-code-350ea.firebaseio.com';
const ServiceUid = 'compilation-api';

firebase.initializeApp({
  serviceAccount: ServiceCredentialsPath,
  databaseURL: DatabaseUrl,
  databaseAuthVariableOverride: {
    uid: ServiceUid
  }
});

let database = firebase.database();

export namespace Firebase {
  // TODO: needs testing
  export function get(path: string): Observable<any> {
    let firebasePromise = database.ref(path).once('value');
    return Observable.fromPromise(firebasePromise);
  }
}


// function loadFromFirebase(dataLocation, callback) {
//   db.ref(dataLocation).once('value', function (snapshot) {
//       if (snapshot.exists()) {
//         callback(undefined, snapshot.val());
//       } else {
//         var err = `Data at "${dataLocation}" does not exist.`
//         callback(err);
//       }
//     }, function (err) {
//       console.error(`Error loading from firebase: ${err}`);
//       callback(err);
//     });
// }
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


