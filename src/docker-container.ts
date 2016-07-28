import * as child_process from 'child_process';
import { Promise } from 'es6-promise';
import * as fs from 'fs';
import * as tmp from 'tmp';

let exec = child_process.exec;
let spawn = child_process.spawn;

export class DockerContainer {
  private containerId: string;
  private currentDirectory: string;

  constructor(private image: string) { }

  start(): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.runCmd(`docker run -d -i ${this.image}`).then(
        output => {
          if (output.err) {
            reject(output.err);
          } else {
            // Initialize container id to output from docker
            this.containerId = output.stdout.trim();
            // Initialize currentDirectory with pwd
            return this.runCmd(`docker exec ${this.containerId} pwd`).then(
              output => {
                if (output.err) {
                  reject(output.err);
                } else {
                  this.currentDirectory = output.stdout.trim();
                  resolve(Promise.resolve());
                }
              });
          }
        }));
  }

  cleanup(): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.runCmd(`docker kill ${this.containerId}`).then(
        output => {
          if (output.err) {
            reject(output.err);
          } else {
            this.runCmd(`docker rm ${this.containerId}`).then(
              output => {
                if (output.err) {
                  reject(output.err);
                } else {
                  resolve();
                }
              });
          }
        }));
  }

  changeDirectory(dir: string): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.runCmd(`docker exec ${this.containerId} sh -c cd ${dir}`).then(
        output => {
          if (output.err) {
            reject(output.err);
          } else {
            this.currentDirectory = dir;
            resolve();
          }
        }));
  }

  mkdirInContainer(dirName: string): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.runCmd(`docker exec ${this.containerId} mkdir -p ${dirName}`).then(
        output => {
          if (output.err) {
            reject(output.err);
          } else {
            this.containerId = output.stdout;
            resolve();
          }
        }));
  }

  copyFile(srcPath: string, destPathInContainer: string): Promise<void> {
    let copyCmd =
      `cat ${srcPath} | docker exec -i ${this.containerId} sh -c 'cat > ${destPathInContainer}'`;
    return new Promise<void>((resolve, reject) =>
      this.runCmd(copyCmd).then(
        output => {
          if (output.err) {
            reject(output.err);
          } else {
            resolve();
          }
        }));
  }

  writeFile(contents: string, destPathInContainer: string): Promise<void> {
    console.log('writing file' + destPathInContainer);

    // This is actually impossible (or at least too complicated).
    // The alternative: create an intermediate file, copy it over, then remove the file
    return new Promise<void>((resolve, reject) =>
      // Create the tmp filename
      tmp.tmpName((err, tmpFilename) => {
        if (err) {
          reject(err);
        } else {
          // Write the data to the tmp file
          fs.writeFile(tmpFilename, contents, err => {
            if (err) {
              reject(err);
            } else {
              // Called after copying
              function cleanup() {
                // Delete the file
                fs.unlink(tmpFilename);
              }
              // Copy the tmp file to a file on the container
              this.copyFile(tmpFilename, destPathInContainer).then(
                () => {
                  resolve();
                  // Delete the file
                  cleanup();
                },
                err => {
                  reject(err);
                  cleanup();
                });
            }
          });
        }
      }));
  }

  /**
   * The script lives on the host, NOT the container.
   */
  runScript(scriptType: string = 'bash', localScriptPath: string, args: string[]): Promise<Output> {
    console.log('running script ' + localScriptPath);

    let argsFmt = args.map(arg => `"${arg}"`).join(' ');
    // TODO: this will cause the docker error if I need it for testing
    // return this.runCmd(`cat ${localScriptPath} | docker exec -i ${scriptType} -s ${argsFmt}`);
    return this.runCmd(
      `cat ${localScriptPath} | docker exec -i ${this.containerId} ${scriptType} -s ${argsFmt}`);
  }

  /**
   * Uses wdiff to compare two files in a container word by word. Wdiff ignores whitespace
   * differences.
   */
  filesAreIdentical(pathToFileA: string, pathToFileB: string): Promise<boolean> {
    let cmd = 'docker';
    let args = [
      'exec',
      this.containerId,
      'bash',
      '-c',
      `wdiff -3 "${pathToFileA}" "${pathToFileB}" | sed '1d;2d;$d'`
    ];
    // TODO: clean this up
    return new Promise<boolean>((resolve, reject) => {
      console.log('diffing files');
      let childProcess = spawn(cmd, args);
      childProcess.on('error', err => {
        console.log('err: ' + err);
        reject(err);
      });
      childProcess.stdout.on('data', data => {
        console.log('diff: ' + data);
        // If wdiff returns any data, then the files are different in some way.
        resolve(false);
      });
      childProcess.stderr.on('data', data => {
        console.log('stderr: ' + data);
        reject(data);
      });
      childProcess.on('close', exitCode => {
        console.log('done: ' + exitCode);
        if (exitCode === 0) {
          resolve(true);
        } else {
          reject(exitCode);
        }
      });
    });
  }

  /**
   * Returns a promise containing the stdout of the ran command.
   */
  private runCmd(cmd: string): Promise<Output> {
    return new Promise<Output>(resolve =>
      exec(cmd, (err, stdout, stderr) => resolve({err, stdout, stderr})));
  }
}

interface Output {
  err: Error;
  stdout: string;
  stderr: string;
}
