////////////////////////////////////////////////////////////////////////////////////////////////////
// Firebase Authentication
////////////////////////////////////////////////////////////////////////////////////////////////////

var firebase = require('firebase');

firebase.initializeApp({
  serviceAccount: './credentials/nu-code-server.json',
  databaseURL: 'https://nu-code-350ea.firebaseio.com',
  databaseAuthVariableOverride: {
    uid: 'compilation-api'
  }
});

var db = firebase.database();

/**
 * Callsback as `callback(err)`
 */
function loadFromFirebase(dataLocation, callback) {
  db.ref(dataLocation).once('value', function (snapshot) {
      if (snapshot.exists()) {
        callback(undefined, snapshot.val());
      } else {
        var err = `Data at "${dataLocation}" does not exist.`
        callback(err);
      }
    }, function (err) {
      console.error(`Error loading from firebase: ${err}`);
      callback(err);
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Express Setup
////////////////////////////////////////////////////////////////////////////////////////////////////

var express = require('express');
var app = express();

var jsonParser = require('body-parser').json();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

var compilers = require('./supported-compilers');
var DockerCompiler = require('./docker-compiler');

var PORT = 8080;

var LangProperty = 'lang';
var SrcProperty = 'src';
var ProblemProperty = 'problem';
var RequiredProperties = [LangProperty, SrcProperty, ProblemProperty];
var BadRequestErr;
(function () {
  var requiredPropertiesLength = RequiredProperties.length;
  var propertyOrProperties = requiredPropertiesLength == 1 ? 'property' : 'properties';

  var list = '';
  if (requiredPropertiesLength == 1) {
    list = RequiredProperties[0];
  } else {
    // assume greater than 1
    for (var i = 0; i < requiredPropertiesLength; i++) {
      if (i > 0) {
        list += ', ';
      }
      if (i == requiredPropertiesLength - 1) {
        list += 'and '
      }
      list += RequiredProperties[i];
    }
  }

  BadRequestErr = {
    error: `Requests must be sent as JSON containing at least`
            + ` ${requiredPropertiesLength} ${propertyOrProperties}: ${list}.`
  };
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Web API
////////////////////////////////////////////////////////////////////////////////////////////////////

// Allow CORS (Cross-Origin Resource Sharing)
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if ('OPTIONS' === req.method) {
    res.send(200);
  } else {
    next();
  }
});

/**
 * See documentation on usage here:
 * https://github.com/Tahler/capstone-api
 */
app.post('/api', jsonParser, function (req, res) {
  var jsonReq = req.body;

  if (hasRequiredProperties(jsonReq, RequiredProperties)) {
    var lang = jsonReq[LangProperty];
    var code = jsonReq[SrcProperty];
    var problemId = jsonReq[ProblemProperty];

    // Loaded asynchronously from firebase
    var seconds, shouldReveal, tests;
    // Set to true in case of errors in order to stop from sending errors back to the user twice
    var errorsOccurred = false;

    // Get problem info
    loadFromFirebase(`/problems/${problemId}`, function (err, problem) {
      if (!err) {
        seconds = problem.timeout;
        shouldReveal = problem.feedback.toLowerCase() === 'revealing';
      }
      onDataLoad(err);
    });
    // Get tests
    loadFromFirebase(`/tests/${problemId}`, function (err, testCases) {
      if (!err) {
        tests = testCases;
      }
      onDataLoad(err);
    });

    function onDataLoad(err) {
      if (err && !errorsOccurred) {
        errorsOccurred = true;
        res.send({ error: err });
      } else if (seconds !== undefined && shouldReveal !== undefined && tests !== undefined) {
        runInDocker();
      }
    }

    function runInDocker() {
      var dockerCompiler = new DockerCompiler(lang, code, seconds, tests, shouldReveal);
      dockerCompiler.run(function (result) {
        res.send(result);
      });
    }
  } else {
    var badRequestErr = JSON.stringify(BadRequestErr);
    res.send(BadRequestErr);
  }
});

function hasRequiredProperties(obj, properties) {
  var hasRequiredProperties = true;
  for (var i = 0; i < properties.length; i++) {
    if (!obj.hasOwnProperty(properties[i])) {
      hasRequiredProperties = false;
      break;
    }
  }
  return hasRequiredProperties;
}

app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
});
