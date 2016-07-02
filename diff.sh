#!/bin/bash

# Uses wdiff to find added, removed, or changed words between two files.

# $1 = The name of the expected output file
# $2 = The name of the actual output file

EXPECTED_OUTPUT_FILE_NAME=$1
ACTUAL_OUTPUT_FILE_NAME=$2

# `wdiff -3` will restrict output to differences
# Pipe into a `sed` command which removes the first, second, and last lines
wdiff -3 "$EXPECTED_OUTPUT_FILE_NAME" "$ACTUAL_OUTPUT_FILE_NAME" \
  | sed '1d;2d;$d'
