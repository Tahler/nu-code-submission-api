#!/bin/bash

# This script compiles / interprets a user's source code.
#
# Compilation Arguments
#   1. The compiler to compile the source file.
#		2. The source file to be compiled.
#		3. The command to execute the object code.
#	Example Usage:
#   ./compile.sh gcc file.c ./a.out
#
# Interpretation Arguments
#   1. The interpreter to interpret the source file.
#		2. The source file to be interpreted.
#	Example Usage:
#   ./compile.sh node file.js

compiler=$1
source_file=$2
runner=$3

OUTPUT="output.txt"
ERRORS="errors.txt"

# Save stdout and stderr
exec 3>&1 4>&2

# Redirect stdout and stderr
exec 1>"$OUTPUT" 2>"$ERRORS"

START_TIME=$(date +%s.%2N)

if [ "$runner" = "" ]; then
  # Interpretation
  $compiler $source_file
else
  # Compilation
  $compiler $source_file

	if [ $? -eq 0 ]; then
  	# No errors (i.e. last return code was 0)
		$runner
	else
    # Errors
    echo "Compilation Failed"
	fi
fi

END_TIME=$(date +%s.%2N)
TOTAL_TIME=$(echo "$END_TIME - $START_TIME" | bc)

# Restore stdout and stderr
exec 1>&3 2>&4

echo "Script finished in $TOTAL_TIME seconds."
