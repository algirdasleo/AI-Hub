export const ErrorType = {
  InvalidParameters: "InvalidParameters",
  NotFound: "NotFound",
  InternalServerError: "InternalServerError",
  ConfigurationError: "ConfigurationError",
  Unauthorized: "Unauthorized",
  StreamError: "StreamError",
  StreamToolError: "StreamToolError",
  DatabaseError: "DatabaseError",
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];
