/*
 * This file contains a single exported object which acts as a map.
 *
 * Each key-value pair creates another supported language.
 * Thus, to support a new language, adding to this file should be the only necessary step.
 *
 * Each key maps to a string array of "compiler arguments".
 * - The 1st column contains the compiler / interpretor that is used for translation.
 * - The 2nd column is the file name of the source code.
 * - The 3rd column is needed only for compiled languages: it contains the command to invoke the
 *   compiled program.
 */

module.exports = {
  c: {
    compiler: "gcc",
    fileName: "solution.c",
    runtime: "./a.out"
  },
  java: {
    compiler: "javac",
    fileName: "Solution.java",
    runtime: "java Solution"
  },
  js: {
    compiler: "node",
    fileName: "solution.js"
  }
}
