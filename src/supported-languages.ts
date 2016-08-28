/*
 * This file contains a single exported object which acts as a map.
 *
 * Each property creates another supported language.
 * Thus, to support a new language, adding to this object should be the only necessary step.
 */
export const SupportedLanguages: SupportedLanguages = {
  'c': {
    compiler: 'gcc',
    filename: 'solution.c',
    runtime: './a.out'
  },
  'cpp': {
    compiler: 'g++',
    filename: 'solution.cpp',
    runtime: './a.out'
  },
  'csharp': {
    compiler: 'mcs',
    filename: 'solution.cs',
    runtime: 'mono solution.exe'
  },
  'go': {
    compiler: 'go build',
    filename: 'solution.go',
    runtime: './solution'
  },
  'java': {
    compiler: 'javac',
    filename: 'Solution.java',
    runtime: 'java Solution'
  },
  'js': {
    filename: 'solution.js',
    runtime: 'nodejs solution.js'
  },
  'python': {
    filename: 'solution.py',
    runtime: 'python2.7 solution.py'
  },
  'python3': {
    filename: 'solution.py',
    runtime: 'python3.5 solution.py'
  },
  'rust': {
    compiler: 'rustc',
    filename: 'solution.rs',
    runtime: './solution'
  },
  'ts': {
    compiler: 'tsc',
    filename: 'solution.ts',
    runtime: 'nodejs solution.js'
  }
};

export function langIsSupported(lang: string): boolean {
  return SupportedLanguages.hasOwnProperty(lang);
};

// Implementing type-safety
interface SupportedLanguage {
  compiler?: string;
  filename: string;
  runtime: string;
}

interface SupportedLanguages {
  [code: string]: SupportedLanguage;
}
