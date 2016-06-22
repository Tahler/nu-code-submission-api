#!/bin/bash

# This script compiles / interprets a user's source code.
#
# Compilation Arguments
#   1. The number of seconds before timing out.
#   2. The compiler to compile the source file.
#		3. The source file to be compiled.
#		4. The command to execute the object code.
#	Example Usage:
#   ./compile.sh 5 gcc file.c ./a.out
#
# Interpretation Arguments
#   1. The number of seconds before timing out.
#   2. The interpreter to interpret the source file.
#		3. The source file to be interpreted.
#	Example Usage:
#   ./compile.sh 10 node file.js

seconds=$1
compiler=$2
source_file=$3
runner=$4

execute()
{
  seconds="$1"
  shift 1
  command=$*

  output=$(timeout "$seconds"s $command)
  exit_code=$?

  echo $output
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

if [ "$runner" = "" ]; then
  # Interpretation

  start_time=$(date +%s.%2N)

  output=$( (execute "$seconds" "$compiler" "$source_file") 2>&1)
  exit_code=$?
else
  # Compilation

  output=$( ("$compiler" "$source_file") 2>&1)
  exit_code=$?

	if [ $exit_code -eq 0 ]; then
  	# No errors (i.e. last return code was 0)

    start_time=$(date +%s.%2N)

    output=$(execute "$seconds" "$runner")
    exit_code=$?
	fi
fi

end_time=$(date +%s.%2N)
total_time=$(echo "$end_time - $start_time" | bc)
status=$(get_status "$exit_code")

echo "{\"status\": \"$status\", \"output\": \"$output\", \"execTime\": $total_time}";
