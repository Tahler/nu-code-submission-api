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

seconds=$1
command=$2
input_file=$3
output_file=$4

execute()
{
  # TODO: I may not want the quotes around $command
  output=$(cat "$input_file" | timeout "$seconds"s $command)
  exit_code=${PIPESTATUS[0]}

  echo "$output"
  return $exit_code
}

get_status()
{
  exit_code="$1"

  SUCCESS_CODE=0
  # 124 is the exit code for a timeout
  TIMEOUT_CODE=124

  case "$exit_code" in
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
start_time=$(date $DATE_EXPRESSION)

# Redirect runtime errors to stdout
output=$(execute "$seconds" "$command" "$input_file" "$output_file" 2>&1)
exit_code=$?

end_time=$(date $DATE_EXPRESSION)
total_time=$(echo "$end_time - $start_time" | bc)
status=$(get_status "$exit_code")

# TODO: will I need to escape '\' to '\\' as well?
# Escape all double quotes
output=$(echo "$output" | sed 's/"/\\"/g')

cat <<EOF
{"status": "$status", "output": "$output", "execTime": $total_time}
EOF

exit $exit_code
