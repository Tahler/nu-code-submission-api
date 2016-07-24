# Capstone API

This is the compilation API for my capstone project.

Below are the details of the web API.

## Requests

Requests should be sent to this API as a 'application/json' post with the following three properties:
- "lang": A string specifying the language code of the source code. A full list can be found in
  the properties of compilers.js.
- "src": A string containing all of the source code.
- "problem": The ID of the problem the solution is attempting to solve.

JSON example:

```json
{
 "lang": "java",
 "src": "import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int x = scanner.nextInt();\n    int y = x * 2;\n    System.out.println(y);\n  }\n}\n",
 "problem": "Double"
}
```

Example request using cURL:

`curl -d '{"lang": "c", "src": "#include <stdio.h>\n\nint main()\n{\n  printf(\"Hello, world!\");\n}"}' -H "Content-Type: application/json" http://localhost:8080/api`

## Responses

Responses are sent as JSON.

If the request was _incorrectly_ formatted, the JSON response will contain a single "error"
property.

```json
{
  "error": "Requests must be sent as JSON containing at least 3 properties: lang, src, and problem."
}
```

If the request was _correctly_ formatted, then the JSON response will depend on the problem's
feedback level:

### Simple Feedback Response

Example responses:

- Pass

```json
{
  "status": "pass",
  "execTime": 0.192401
}
```

- Fail

```json
{
  "status": "fail"
}
```

- Timeout

```json
{
  "status": "timeout"
}
```

- Error

```json
{
  "status": "error",
  "message": "solution.c: In function 'main':\nsolution.c:2:31: error: expected ';' before '}' token\n int main() { printf(\"233168\") }\n                               ^\n"
}
```

### Revealing Feedback Response

Revealing feedback gives feedback on a test-by-test basis. Each test will give an individual report
of "pass", "fail", "timeout", or "error". In the case of a failed submission, a list of differences
(i.e. expected: x, actual: x) will be given.

- Pass

```json
{
  "status": "pass",
  "execTime": 0.192401
}
```

- Fail

```json
{
  "status": "fail",
  "results": [ {
    "status": "fail",
    "differences": [ {
      "expected":"2",
      "actual":"3" } ]
  }, {
    "status": "error",
    "message": [ {
      "expected":"2",
      "actual":"3" } ]
  }, {
    "status": "pass"
  } ]
}
```
