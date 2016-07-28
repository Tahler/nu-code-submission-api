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

################################################################################
# Begin script
################################################################################

# Redirect compilation errors to stdout
"$compiler" "$source_file"
exit_code=$?

exit $exit_code
