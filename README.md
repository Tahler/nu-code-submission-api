# Capstone

This is my capstone project.

## TODO:

- Test with malevolent code
- Extend the API to run a diff against expected output
- Extend the docker image to contain at least required compilers.
  - Java
  - C#
  - JavaScript
  - Python
  - C
  - C++

## Tests

- On each language
  - Compiles and runs a properly written source file
  - Responds with compilation errors
  - Stdin is properly received
- Malevolent testing
  - Infinite loops
  - File writing
  - Bash injection
  - Creating and running other programs
  - Shutdown request
