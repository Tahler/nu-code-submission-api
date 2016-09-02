# Submission API

This is the Submission API for [NU Code](http://code.neumont.edu/), my capstone project.

## Interface

For details on how to send requests and what responses to expect, read
[here](https://github.com/Tahler/submission-api/blob/master/doc/api.md).

## Firebase and Credentials

NU Code utilizes Firebase for storing data and user authentication. This API will needs access to
the Firebase instance.

Git is deliberately ignoring the credentials folder, which holds the Firebase server credentials
needed to access the Firebase instance. Running this project as is will require a Firebase server
with a legal [schema](https://github.com/Tahler/submission-api/blob/master/doc/example-schema.json)
and the credentials to access it.

## Installation, Building, and Starting

With [external dependencies](#external-dependencies) installed:

Install local dependencies: `npm install`

Start the API: `gulp start`

Stop the API: `gulp stop`

Look for the container's IP address: `docker inspect api`
