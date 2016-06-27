#!/bin/bash

# Must be run from this directory as ./build-webserver.sh

docker build -t web -f web.dockerfile ..
