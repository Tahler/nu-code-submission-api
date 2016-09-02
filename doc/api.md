## Requests

Requests should be posted to '/submit' as 'application/json' with the following properties:
- "lang": A string specifying the language code of the source code. [See the full list](https://github.com/Tahler/nu-code-compilation-api/blob/master/doc/supported-languages.md).
- "src": A string containing all of the source code.
- "problem": The ID of the problem the solution is attempting to solve.
- "submitterToken": (Optional) The Firebase user token of the submitter.
- "competition": (Optional) The ID of the competition the problem belongs to. Only needed if
  submitting to a competition problem.

JSON example:

```json
{
 "lang": "java",
 "src": "import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int x = scanner.nextInt();\n    int y = x * 2;\n    System.out.println(y);\n  }\n}\n",
 "problem": "Double"
}
```

Example request using cURL:

`curl -d '{ "lang": "java", "src": "import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int x = scanner.nextInt();\n    int y = x * 2;\n    System.out.println(y);\n  }\n}\n", "problem": "Double"}' -H "Content-Type: application/json" http://code.neumont.edu/submit`
