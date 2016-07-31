export const RequiredProperties: string[] = [
  'lang',
  'src',
  'problem'
];

export interface Request {
  lang: string;
  src: string;
  problem: string;
  submittedOn: string;
  submitterUid?: string;
}

export namespace Request {
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
