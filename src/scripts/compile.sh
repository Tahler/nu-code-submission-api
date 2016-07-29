#!/bin/bash

# This script only compiles a user's code. In the case of running an interpreted
# language, skip straight to run.sh.
#
# Arguments
#   1. The compiler to compile the source file.
#		2. The source file to be compiled.
#	Example Usage:
#   ./compile.sh gcc file.c

compiler=$1
source_file=$2

COMPILATION_ERR_CODE=127

################################################################################
# Begin script
################################################################################

# TODO: is this necessary? some compilers may output to stderr
# Redirect compilation errors to stdout
"$compiler" "$source_file"

if [ $? -eq 0 ]; then
  exit_code=0
else
  exit_code=$COMPILATION_ERR_CODE
fi

exit $exit_code
