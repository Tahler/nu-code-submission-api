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
    var seconds, feedback, tests;
    // Set to true in case of errors in order to stop from sending errors back to the user twice
    var errors = false;

    // Get problem info
    db.ref(`/problems/${problemId}`).once('value', function (snapshot) {
      if (snapshot.exists()) {
        var problem = snapshot.val();
        feedback = problem.feedback;
        seconds = problem.timeout;
        onDataLoad();
      } else {
        onDataLoad(`Problem "${problemId}" does not exist.`);
      }
    }, function (err) {
      console.log(`Error loading problem: ${err}`);
      onDataLoad(err);
    });
    // Get tests
    db.ref(`/tests/${problemId}`).once('value', function (snapshot) {
      if (snapshot.exists()) {
        tests = snapshot.val();
        onDataLoad();
      } else {
        onDataLoad(`Problem "${problemId}" does not exist.`);
      }
    }, function (err) {
      console.log(`Error loading tests: ${err}`);
      onDataLoad(err);
    });

    function onDataLoad(err) {
      if (err && !errors) {
        errors = true;
        res.send({ error: err });
      } else if (seconds && feedback && tests) {
        runInDocker();
      }
    }

    function runInDocker() {
      var dockerCompiler = new DockerCompiler(lang, code, seconds, tests);
      dockerCompiler.run(function (result) {
        // TODO: filter the result based on the feedback level
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
