# Capstone

This is my capstone project.

## TODO:

- Test with malicious code
- Extend the API to run a diff against expected output

## Diff options

- Extend the api to send an array of input and output pairs
- Iteratively redirect each input and diff each output

- Simple pass or fail
- Number of tests passing
- Very specific - this test failed: expected: x, actual: x
- A progression over all three

Check out:
- KDiff3

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
