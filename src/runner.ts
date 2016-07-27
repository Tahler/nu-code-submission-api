import { DockerContainer } from './docker-container';
import { SupportedLanguages } from './supported-languages';
import { Test } from './test';
import { Promise } from 'es6-promise';

const DockerImage = 'compiler';
const ContainerUserDir = '~';

// TODO: actually move these scripts
const CompileScript = './scripts/compile.sh';
const RunScript = './scripts/run.sh';

const InputFilenamePrefix = 'input-';
const ExpectedOutputFilenamePrefix = 'expected-output-';
const ActualOutputFilenamePrefix = 'actual-output-';

const TimeoutCode = 124;

export class Runner {
  private compiler: string;
  private runtime: string;
  private filename: string;

  constructor(
    lang: string,
    private src: string,
    private seconds: number,
    private tests: Test[]
  ) {
    let params = SupportedLanguages[lang];
    this.compiler = params.compiler;
    this.filename = params.filename;
    this.runtime = params.runtime;
  }

  isCompiled(): boolean {
    // !! converts a truthy value to a boolean.
    return !!this.compiler;
  }

  run(): Promise<FinalResult> {
    // Start the container
    return this.startContainer().then(
      // Copy necessary files
      container => this.copyFiles(container).then(
        // Compile, run, and return the result
        () => this.testUserCode(container)));
  }

  private startContainer(): Promise<DockerContainer> {
    let container = new DockerContainer(DockerImage);
    return new Promise<DockerContainer>((resolve, reject) =>
      // Start the docker container
      container.start().then(
        // Switch to the directory the user's code will run in
        () => container.changeDirectory(ContainerUserDir).then(
          // TODO: double check that an err goes to the cleanup section
          () => resolve(container),
          err => {
            reject(err);
            console.error('Error changing directory: ' + err);
          }),
        err => {
          reject(err);
          container.cleanup().catch(
            err => console.error('Error removing container: ' + err));
        }));
  }

  /**
   * Copies all the necessary files for execution.
   */
  private copyFiles(container: DockerContainer): Promise<void> {
    // The only thing needed is the src file.
    // TODO: is this true?
    return container.writeFile(this.src, this.filename);
  }

  private testUserCode(container: DockerContainer): Promise<FinalResult> {
    return new Promise<FinalResult>((resolve, reject) =>
      this.compileIfNecessary(container).then(
        result => {
          if (result.success) {
            this.runAllTests(container);
          } else {
            resolve({
              message: result.message,
              status: 'CompilationError'
            });
          }
        })
    );
  }

  /**
   * If `this.lang` is a compiled language, this method will compile the program and resolve a
   * CompilationResult containing any possible errors. Otherwise, a successful CompilationResult is
   * immediately resolved.
   */
  private compileIfNecessary(container: DockerContainer): Promise<CompilationResult> {
    return new Promise<CompilationResult>(resolve => {
      if (this.isCompiled()) {
        container.runScript('bash', CompileScript, [this.compiler, this.filename]).then(
          output => {
            // TODO: making assumptions here...
            // TODO: I think output.err could be a result from a docker error or compilation error
            let compilationResult = output.err
              ? { message: output.stderr, success: false }
              : { success: true };
            resolve(compilationResult);
          });
      } else {
        resolve({ success: true });
      }
    });
  }

  private runAllTests(container: DockerContainer): Promise<FinalResult> {
    return new Promise<FinalResult>((resolve, reject) => {
      // Run each test asynchronously
      let testRuns: Promise<TestResult>[] = this.tests.map((test, testNumber) =>
        // Write test input to the container
        container.writeFile(test.input, `${InputFilenamePrefix}${testNumber}`).then(
          // Run against input
          () => this.runTest(container, testNumber)));
      // Only return once all have been completed
      Promise.all(testRuns).then(
        testResults => {
          let totalExecTime = 0;
          let firstErr: TestResult;
          let hints = [];
          // TODO: is this synchronous? It should be
          testResults.forEach(testResult => {
            if (testResult.status === 'Pass') {
              totalExecTime += testResult.execTime;
            } else {
              if (!firstErr) {
                firstErr = testResult;
              }
              if (testResult.hint) {
                hints.push(testResult.hint);
              }
            }
          });
          // TODO: double check
          let finalResult: FinalResult = firstErr
            ? {
              hints: hints.length ? hints : undefined,
              message: firstErr.message,
              status: firstErr.status
            }
            : {
              execTime: totalExecTime,
              status: 'Pass'
            };
          return finalResult;
        },
        err => console.error('Could not run all tests: ' + err));
    });
  }

  private runTest(container: DockerContainer, testNumber: number): Promise<TestResult> {
    let args = [
      this.seconds.toString(),
      this.runtime,
      `${InputFilenamePrefix}${testNumber}`,
      `${ActualOutputFilenamePrefix}${testNumber}`
    ];
    return new Promise<TestResult>((resolve, reject) =>
      container.runScript('bash', RunScript, args).then(
        output => {
          let err: any = output.err;
          if (err) {
            let failingTestResult: TestResult = err.code === TimeoutCode
              ? { status: 'Timeout' }
              : {
                message: output.stderr,
                status: 'RuntimeError'
              };
            resolve(failingTestResult);
          } else {
            return this.testPassed(container, testNumber).then(
              testPassed => testPassed
                ? { execTime: parseFloat(output.stdout), status: 'Pass' }
                // Will not actually be set if hint is undefined
                // TODO: is this true?
                : { hint: this.tests[testNumber].hint, status: 'Fail' });
          }
        }));
  }

  private testPassed(container: DockerContainer, testNumber: number): Promise<boolean> {
    let expectedOutput = this.tests[testNumber].output;
    let actualOutputFilename = `${ActualOutputFilenamePrefix}${testNumber}`;
    let expectedOutputFilename = `${ExpectedOutputFilenamePrefix}${testNumber}`;
    return container.writeFile(expectedOutput, expectedOutputFilename).then(
      () => container.filesAreIdentical(expectedOutputFilename, actualOutputFilename));
  }
}

interface CompilationResult {
  success: boolean;
  // The error message, included if success is false
  message?: string;
}

interface TestResult {
  status: TestResultStatus;
  // If status === 'Pass'
  execTime?: number;
  // If status === 'Fail' and the test had a hint
  hint?: string;
  // If status === 'CompilationError' | 'RuntimeError'
  message?: string;
}

type TestResultStatus = 'Pass' | 'Fail' | 'Timeout' | 'RuntimeError';

interface FinalResult {
  status: FinalResultStatus;
  // If status === 'Pass'
  execTime?: number;
  // If status === 'Fail' and one of the failed tests had a hint
  hints?: string[];
  // If status === 'CompilationError' | 'RuntimeError'
  message?: string;
}

type FinalResultStatus = TestResultStatus | 'CompilationError';
