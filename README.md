# Compilation Engine

This is the compilation API for [NU Code](http://code.neumont.edu/), my capstone project.

Technologies:
- [Node](https://nodejs.org/en/) / [TypeScript](https://www.typescriptlang.org/) / [Express](http://expressjs.com/) to define the API succinctly.
- [Docker](https://www.docker.com/) to contain user-submitted code.
- [Firebase](https://firebase.google.com/) for storing data and user authentication.
- [Gulp](http://gulpjs.com/) for automating the build and run processes.

## Interface

For details on how to send requests and what responses to expect, read
[here](https://github.com/Tahler/capstone-api/blob/master/doc/api.md).

## Supported Languages

A list of all the supported languages can be found
[here](https://github.com/Tahler/capstone-api/blob/master/doc/supported-languages.md).

## Firebase and Credentials

NU Code utilizes Firebase for storing data and user authentication. This API will needs access to
the Firebase instance.

Git is deliberately ignoring the credentials folder, which holds the Firebase server credentials
needed to access the Firebase instance. Running this project as is will require a Firebase server
with a legal [schema](https://github.com/Tahler/capstone-api/blob/master/doc/example-schema.json)
and the credentials to access it.

## External Dependencies

As this API is meant to run in a docker container, [Docker](https://www.docker.com/) must be
installed with the docker binary added to the system path. See Docker's official installation
instructions [here](https://docs.docker.com/engine/installation/).

You will also need a
[Firebase instance and the server credentials to access it](#firebase-and-credentials).

## Installation, Building, and Starting

With [external dependencies](#external-dependencies) installed:

Install local dependencies: `npm install`

Start the API: `gulp start-api`

Stop the API: `gulp stop-api`

Look for the container's IP address: `docker inspect api`
