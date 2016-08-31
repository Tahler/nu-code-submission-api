# API

This document details the proper format for requests and what the caller should expect in terms of
response.

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

`curl -d '{ "lang": "java", "src": "import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int x = scanner.nextInt();\n    int y = x * 2;\n    System.out.println(y);\n  }\n}\n", "problem": "Double"}' -H "Content-Type: application/json" http://localhost:8080/api`

## Responses

Responses are sent as JSON. TODO: this documentation is outdated

If the request was _incorrectly_ formatted, the JSON response will contain a single "error"
property.

```json
{
  "error": "Requests must be sent as JSON containing at least 3 properties: lang, src, and problem."
}
```

If the request was _correctly_ formatted, then the JSON response will depend on the problem's
feedback level:

### Feedback Response

Example responses:

- Pass

```json
{
  "status": "Pass",
  "execTime": 0.192401
}
```

- Fail

```json
{
  "status": "Fail"
}
```

- Fail with Hints

```json
{
  "status": "Fail",
  "hints": [
    "Account for dividing by 0."
  ]
}
```

- Timeout

```json
{
  "status": "Timeout"
}
```

- Compilation Error

```json
{
  "status": "CompilationError",
  "message": "solution.c: In function 'main':\nsolution.c:2:31: error: expected ';' before '}' token\n int main() { printf(\"233168\") }\n                               ^\n"
}
```

- Runtime Error

```json
{
  "status": "RuntimeError",
  "message": "Exception in thread \"main\" java.lang.RuntimeException\n	at Solution.main(Solution.java:3)"
}
```
