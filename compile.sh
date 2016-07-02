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

get_status()
{
  exit_code="$1"

  case "$exit_code" in
    0)
      echo "success"
      ;;
    *)
      echo "error"
      ;;
  esac
}

################################################################################
# Begin script
################################################################################

# Redirect compilation errors to stdout
output=$("$compiler" "$source_file" 2>&1)
exit_code=$?

status=$(get_status "$exit_code")

# Escape all double quotes
output=$(echo "$output" | sed 's/"/\\"/g')

if [ $exit_code -eq 0 ]; then

cat <<EOF
{"status": "$status"}
EOF

else

cat <<EOF
{"status": "$status", "output": "$output"}
EOF

fi

exit $exit_code
