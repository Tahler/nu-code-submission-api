#!/bin/bash

# $NAME must match $NAME in start-webserver.sh
NAME=api

docker kill $NAME
docker rm $NAME
