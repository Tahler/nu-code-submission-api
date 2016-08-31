export const RequiredProperties: string[] = [
  'lang',
  'src',
  'problem'
];

export interface Submission {
  lang: string;
  src: string;
  problem: string;
  submittedOn: number;
  competition?: string;
  submitterToken?: string;
}

export namespace Submission {
  export function hasRequiredProperties(obj: any): boolean {
    let hasRequiredProperties = true;
    RequiredProperties.forEach(requiredProperty => {
      if (!obj.hasOwnProperty(requiredProperty)) {
        hasRequiredProperties = false;
      }
    });
    return hasRequiredProperties;
  }
}
