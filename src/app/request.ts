export interface Request {
  lang: string;
  src: string;
  problem: string;
}

export namespace Request {
  /**
   * Returns true if `obj` adheres to the Request interface.
   */
  export function isValid(obj: any): boolean {
    return obj.lang && obj.src && obj.problem;
  }
}
