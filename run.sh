#!/bin/bash

# This script executes a user's program: it either runs the user's compiled code
# or interprets the user's source code depending on the arguments passed in.
#
# Arguments
#   1. The number of seconds before timing out.
#		2. The command to execute the object code.
#   3. The name of the input file to redirect into the program.
#   4. (Optional) The name of the output file that should hold the outputted
#      results. If unspecified, the output will be returned as JSON data. TODO: here
#	Example Usage:
#   ./run.sh 1 "./a.out" input.txt output.txt
#   ./run.sh 3 "nodejs solution.js" input.txt output.txt

SECONDS=$1
COMMAND=$2
INPUT_FILE=$3
OUTPUT_FILE=$4

get_status()
{
  EXIT_CODE="$1"

  SUCCESS_CODE=0
  # 124 is the exit code for a timeout
  TIMEOUT_CODE=124

  case "$EXIT_CODE" in
    $SUCCESS_CODE)
      echo "success"
      ;;
    $TIMEOUT_CODE)
      echo "timeout"
      ;;
    *)
      echo "error"
      ;;
  esac
}

################################################################################
# Begin script
################################################################################

DATE_EXPRESSION="+%s.%N"
START_TIME=$(date $DATE_EXPRESSION)

# Redirect runtime errors to stdout
output=$( (cat "$INPUT_FILE" | timeout "$SECONDS"s $COMMAND) \
  2>&1 \
  1>$OUTPUT_FILE)
EXIT_CODE=${PIPESTATUS[0]}

END_TIME=$(date $DATE_EXPRESSION)
TOTAL_TIME=$(echo "$END_TIME - $START_TIME" | bc)
STATUS=$(get_status "$EXIT_CODE")

# TODO: will I need to escape '\' to '\\' as well?
# Escape all double quotes
output=$(echo "$output" | sed 's/"/\\"/g')

# TODO: direct stdout to the output file and stderr to $output
if [ $EXIT_CODE -eq 0 ]; then
  echo $TOTAL_TIME
else
  echo "$output"
fi

exit $EXIT_CODE
