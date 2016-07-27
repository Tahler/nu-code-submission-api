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
    return new Promise<void>((resolve, reject) => {
      this.runCmd(`docker run -d -i ${this.image}`).then(
        stdout => {
          // Initialize container id to output from docker
          this.containerId = stdout.trim();
          // Initialize currentDirectory with pwd
          return this.runCmd(`docker exec ${this.containerId} pwd`).then(
            stdout => {
              this.currentDirectory = stdout.trim();
              resolve(Promise.resolve());
            });
        },
        err => reject(err)
      );
    });
  }

  cleanup(): Promise<void> {
    return this.runCmd(`docker kill ${this.containerId}`).then(
      () => {
        this.runCmd(`docker rm ${this.containerId}`).then(
          () => {
            return Promise.resolve();
          }
        );
      }
    );
  }

  changeDirectory(dir: string): Promise<void> {
    return this.runCmd(`docker exec ${this.containerId} sh -c cd ${dir}`).then(
      () => {
        this.currentDirectory = dir;
        return Promise.resolve();
      }
    );
  }

  mkdirInContainer(dirName: string): Promise<void> {
    return this.runCmd(`docker exec ${this.containerId} mkdir -p ${dirName}`).then(
      stdout => {
        this.containerId = stdout;
        return Promise.resolve();;
      }
    );
  }

  copyFile(srcPath: string, destPathInContainer: string): Promise<string> {
    return this.runCmd(
      `cat ${srcPath} | docker exec -i ${this.containerId} sh -c 'cat > ${destPathInContainer}'`);
  }

  makeFileExecutable(pathToFileInContainer: string): Promise<string> {
    return this.runCmd(`docker exec ${this.containerId} chmod a+rwx ${pathToFileInContainer}`);
  }

  copyExecutable(pathToExecutable: string, destPathInContainer: string): Promise<string> {
    return this.copyFile(pathToExecutable, destPathInContainer)
      .then(() => this.makeFileExecutable(destPathInContainer));
  }

  writeFile(contents: string, destPathInContainer: string): Promise<void> {
    // This is actually impossible (or at least too complicated).
    // The alternative: create an intermediate file, copy it over, then remove the file
    return new Promise<void>((resolve, reject) => {
      // Create the tmp filename
      tmp.tmpName((err, tmpFilename) => {
        if (err) {
          reject(err);
        } else {
          // Write the data to the tmp file
          fs.writeFile(tmpFilename, contents, (err) => {
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
                }
              );
            }
          });
        }
      });
    });
  }

  /**
   * Uses wdiff to compare two files in a container word by word. Wdiff ignores whitespace
   * differences.
   */
  filesAreDifferent(pathToFileA: string, pathToFileB: string): Promise<boolean> {
    let cmd = 'docker';
    let args = [
      'exec',
      this.containerId,
      'bash',
      '-c',
      `cd "${this.currentDirectory}" &&`
      + ` wdiff -3 "${pathToFileA}" "${pathToFileB}" | sed '1d;2d;$d'`
    ];
    return new Promise<boolean>((resolve, reject) => {
      let childProcess = spawn(cmd, args);
      childProcess.on('error', (err) => {
        reject(err);
      });
      childProcess.stdout.on('data', (data) => {
        // If wdiff returns any data, then the files are different in some way.
        resolve(false);
      });
      childProcess.on('close', (exitCode) => {
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
  private runCmd(cmd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else if (stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}
