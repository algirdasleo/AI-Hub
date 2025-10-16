import { ErrorType } from "./error-type";

export class ErrorBase<T extends ErrorType = ErrorType> extends Error {
  type: T;
  message: string;
  details?: unknown;

  constructor({ type, message, details }: { type: T; message: string; details?: unknown }) {
    super();
    this.type = type;
    this.message = message;
    this.details = details;
  }
}
