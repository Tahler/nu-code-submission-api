import { DockerContainer } from './docker-container';
import { SupportedLanguages } from './supported-languages';
import { Test } from './test';
import { Promise } from 'es6-promise';

const DockerImage = 'compiler';
const ContainerUserDir = '~';

const CompileCommand = 'compile.sh';
const RunCommand = 'run.sh';
const DiffCommand = 'diff.sh';

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

  run(): Promise<Result> {
    let container = new DockerContainer(DockerImage);
    return new Promise<Result>((resolve, reject) => {
      // Start the docker container
      container.start().then(
        () => {
          // Switch to the directory the user's code will run in
          container.changeDirectory(ContainerUserDir).then(() => {
            container.cleanup();
          });
        },
        err => {
          reject(err);
          container.cleanup(); // TODO: ignoring the promise
        }
      );
    });
  }
}

interface Result {
  status: Status;
  // If status === 'Pass'
  execTime?: number;
  // If status === 'Fail' and one of the failed tests had a hint
  hints?: string[];
  // If status === 'CompilationError' | 'RuntimeError'
  message?: string;
}

type Status = 'Pass' | 'Fail' | 'Timeout' | 'CompilationError' | 'RuntimeError';
