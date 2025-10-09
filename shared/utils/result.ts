import { ErrorBase } from "./error-base.js";
import { ErrorType } from "./error-type.js";
export class Result<T, E extends ErrorBase = ErrorBase> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  static fail<T extends ErrorType = ErrorType>(params: {
    type: T;
    message: string;
    details?: unknown;
  }): Result<never, ErrorBase<T>> {
    const error = new ErrorBase(params);
    return new Result<never, ErrorBase<T>>(false, undefined, error);
  }

  static ok<T>(value: T): Result<T> {
    return new Result<T>(true, value, undefined);
  }

  static okVoid(): Result<void> {
    return new Result<void>(true, undefined, undefined);
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error("Cannot retrieve value from an error result");
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error("Cannot retrieve error from a success result");
    }
    return this._error as E;
  }
}
