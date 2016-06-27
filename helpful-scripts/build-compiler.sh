#!/bin/bash

# Must be run from this directory as ./build-compiler.sh

docker build -t compiler -f compiler.dockerfile ..
