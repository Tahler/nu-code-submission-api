#!/bin/bash

# Internal Port must match PORT in app.js
INTERNAL_PORT=8080
EXTERNAL_PORT=8080
NAME=web
IMAGE=web
DOCKER_SOCKET_PATH=/var/run/docker.sock

docker run -d --name $NAME -p $EXTERNAL_PORT:$INTERNAL_PORT \
           -v $DOCKER_SOCKET_PATH:$DOCKER_SOCKET_PATH web
