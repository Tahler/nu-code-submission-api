import { RequiredProperties } from './request';

interface Error {
  error: string;
}

export class LanguageUnsupportedError implements Error {
  error: string;

  constructor(requestedLang: string) {
    this.error = `Language ${requestedLang} is not supported.`
        + ` See a list of supported compilers here:`
        + ` https://github.com/Tahler/capstone-api/blob/master/supported-languages.md`;
  }
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

export const UnexpectedError: Error = {
  error: 'The server ran into an unexpected error.'
};
