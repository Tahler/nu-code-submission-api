# Capstone

This is my capstone project.

## TODO:

- Test with malicious code
- Extend the API to run a diff against expected output

## Diff options

- Extend the api to send an array of input and output pairs
- Iteratively redirect each input and diff each output
- Either all tests pass or the solution is deemed incorrect.

- Strict
  - Shows only pass or fail. No additional info is provided, including compilation and runtime errors.
- Error reporting
  - Shows pass or fail. Any compilation or runtime errors are sent back to the user.
- Granular
  - Shows the number of tests passing
  - A simple report on each test will be sent back. Each test displays pass / fail.
- Hinting
  - Shows, for example, this test failed: expected: x, actual: x
  - A specific report on each test will be sent back to the user. Each test displays pass / fail: expected: x, actual: x
- Learning
  - A progression over the bottom three stages following failed attempts

Check out:
- KDiff3

### Implementation Thoughts

Separate docker exec statements for compile.sh, run.sh, and diff.sh

Flow:
```
compile.sh
  if errors
    exit with info
  else
    for each test case i
      run.sh _ input-i.txt actual-output-i.txt
        if errors
          exit with info
    if all run.sh's succeed (no errors)
      for each test case i
        diff.sh expected-output-i.txt actual-output.txt some-specificity-option
          report
      report

What the user sees:
--Compilation Error-------------------------------------------------------------
Compilation Error:
  __________
--Simple Pass Fail--------------------------------------------------------------
Correct / Incorrect
Runtime Error:
  __________
--Number of Tests Passing-------------------------------------------------------
Test 1/4:
  Passed
Test 2/4:
  Failed
Test 3/4:
  Passed
Test 4/4:
  Runtime Error:
    __________
--Specific----------------------------------------------------------------------

```

## Tests

- On each language:
  - Compiles and runs a properly written source file
  - Responds with compilation errors
  - Stdin is properly received

### Infinite Loops (pass)

```
curl -d '{"seconds": 3, "lang": "java", "src": "public class Solution { public static void main(String[] args) { while (true) { System.out.println(true); } } }' -H "Content-Type: application/json" http://172.17.0.2:8080/api
```

### File Writing (pass)

```
curl -d '{"seconds": 3, "lang": "java", "src": "import java.nio.file.*; public class Solution { public static void main(String[] args) { try{ while (true) { Files.write(Paths.get(\"hello.txt\"), new byte[1]); } } catch (Exception e) { e.printStackTrace(); } } }"}' -H "Content-Type: application/json" http://172.17.0.2:8080/api
```

### Flooding Output (pass)

```
curl -d '{"seconds": 3, "lang": "js", "src": "while (true) { console.log(0); }"}' -H "Content-Type: application/json" http://172.17.0.2:8080/api
```

### Root level operations

### Bash Injection?

### Creating & Running Other Programs

### Shutdown Request
