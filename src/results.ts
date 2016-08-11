export interface CompilationResult {
  success: boolean;
  // The error message, included if success is false
  message?: string;
}

type TestResultStatus = 'Pass' | 'Fail' | 'Timeout' | 'RuntimeError';

export interface TestResult {
  status: TestResultStatus;
  // If status === 'Pass'
  execTime?: number;
  // If status === 'Fail' and the test had a hint
  hint?: string;
  // If status === 'CompilationError' | 'RuntimeError'
  message?: string;
}

type FinalResultStatus = TestResultStatus | 'CompilationError';

export interface Result {
  status: FinalResultStatus;
  // If status === 'Pass'
  execTime?: number;
  // If status === 'Fail' and one of the failed tests had a hint
  hints?: string[];
  // If status === 'CompilationError' | 'RuntimeError'
  message?: string;
}

export interface UserSubmission {
  lang: string;
  status: FinalResultStatus;
  submittedOn: number;
  // If status === 'Pass'
  execTime?: number;
}

export interface SuccessfulSubmission {
  lang: string;
  execTime: number;
  submittedOn: number;
  submitterUid: string;
}
