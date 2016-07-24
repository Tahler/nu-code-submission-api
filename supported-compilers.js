/*
 * This file contains a single exported object which acts as a map.
 *
 * Each property creates another supported language.
 * Thus, to support a new language, adding to this file should be the only necessary step.
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
    filename: 'solution.js',
    runtime: 'nodejs solution.js'
  },
  csharp: {
    compiler: 'mcs',
    filename: 'solution.cs',
    runtime: 'mono solution.exe'
  },
  python: {
    filename: 'solution.py',
    runtime: 'python2.7 solution.py'
  },
  python3: {
    filename: 'solution.py',
    runtime: 'python3.5 solution.py'
  }
}
