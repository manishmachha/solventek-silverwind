export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  errorCode: string;
  path: string;
  method: string;
  traceId: string;
  requestId: string;
  pointer?: string;
  validation?: ValidationDetails;
  json?: JsonDetails;
  database?: DbDetails;
  security?: SecurityDetails;
  meta?: { [key: string]: any };
  causes?: CauseDetails[];
  hints?: string[];
}

export interface CauseDetails {
  type: string;
  message: string;
}

export interface ValidationDetails {
  count: number;
  fieldErrors?: FieldViolation[];
  paramErrors?: ParamViolation[];
  summary?: { [key: string]: string };
}

export interface FieldViolation {
  object: string;
  field: string;
  rejectedValue?: any;
  message: string;
  constraint: string;
  expected?: { [key: string]: any };
  codes?: string[];
}

export interface ParamViolation {
  path: string;
  param: string;
  rejectedValue?: any;
  message: string;
  constraint: string;
  expected?: { [key: string]: any };
}

export interface JsonDetails {
  problem: string;
  at: string;
  expectedType: string;
  receivedValue?: any;
  rawMessage: string;
}

export interface DbDetails {
  problem: string;
  constraintName?: string;
  detail: string;
}

export interface SecurityDetails {
  problem: string;
  detail: string;
}
