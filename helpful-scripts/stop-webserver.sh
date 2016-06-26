#!/bin/bash

# $NAME must match $NAME in start-webserver.sh
NAME=web

docker kill web
docker rm web
