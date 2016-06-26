#!/bin/bash

# TODO: extract constants, especially port

docker run --rm --name web -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock web
