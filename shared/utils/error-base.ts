import { ErrorType } from "./error-type.js";
export class ErrorBase<T extends ErrorType = ErrorType> extends Error {
  type: T;
  message: string;
  cause?: any;

  constructor({ type, message, cause }: { type: T; message: string; cause?: any }) {
    super();
    this.type = type;
    this.message = message;
    this.cause = cause;
  }
}
