import { RequiredProperties } from './request';

interface Error {
  error: string;
}

export class InvalidRequestError implements Error {
  error: string;

  constructor(invalidRequest: any) {
    let missingProperties = InvalidRequestError.findMissingProperties(invalidRequest);
    let formattedMissingProperties = missingProperties
        .map(missingProperty => `"${missingProperty}"`)
        .join(', ');
    this.error = 'Requests must be sent as JSON containing 3 properties: "lang",'
      + ` "src", and "problem". Missing properties: ${formattedMissingProperties}.`
      + ` For more details, visit https://github.com/Tahler/capstone-api/blob/master/README.md.`;
  }

  private static findMissingProperties(invalidRequest: any): string[] {
    let missingProperties: string[] = [];
    RequiredProperties.forEach(requiredProperty => {
      if (!invalidRequest.hasOwnProperty(requiredProperty)) {
        missingProperties.push(requiredProperty);
      }
    });
    return missingProperties;
  }
}

export class FirebasePathDoesNotExistError implements Error {
  error: string;

  constructor(path: string) {
    this.error = `Path "${path}" does not exist.`;
  }
}

export class ProblemDoesNotExistError implements Error {
  error: string;

  constructor(problemId: string) {
    this.error = `Problem "${problemId}" does not exist.`;
  }
}

export class CompetitionDoesNotExistError implements Error {
  error: string;

  constructor(competitionId: string) {
    this.error = `Competition "${competitionId}" does not exist.`;
  }
}

export class CompetitionNotStartedError implements Error {
  error: string;

  constructor(competitionId: string) {
    this.error = `Competition "${competitionId}" has not started.`;
  }
}

export class CompetitionEndedError implements Error {
  error: string;

  constructor(competitionId: string) {
    this.error = `Competition "${competitionId}" has ended.`;
  }
}

export const InvalidTokenError: Error = {
  error: 'Either the user token is missing or is invalid.'
};

export const NoTokenError: Error = {
  error: 'You must include a user token.'
};

export const UnexpectedError: Error = {
  error: 'The server ran into an unexpected error.'
};
