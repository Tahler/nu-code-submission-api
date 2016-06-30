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
    compiler: 'gcc',
    filename: 'solution.c',
    runtime: './a.out'
  },
  cpp: {
    compiler: 'g++',
    filename: 'solution.cpp',
    runtime: './a.out'
  },
  java: {
    compiler: 'javac',
    filename: 'Solution.java',
    runtime: 'java Solution'
  },
  js: {
    compiler: 'nodejs',
    filename: 'solution.js'
  },
  csharp: {
    compiler: 'mcs',
    filename: 'solution.cs',
    runtime: 'mono solution.exe'
  },
  python: {
    compiler: 'python2.7',
    filename: 'solution.py'
  },
  python3: {
    compiler: 'python3.5',
    filename: 'solution.py'
  }
}
