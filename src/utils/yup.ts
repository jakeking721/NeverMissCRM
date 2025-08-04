// src/utils/yup.ts
// -----------------------------------------------------------------------------
// Minimal subset of Yup used for intake validation. Provides string and object
// schemas with required, email, matches and validate methods.
// -----------------------------------------------------------------------------

export class ValidationError extends Error {
  inner: Array<{ path: string; message: string }> = [];
  constructor(message: string, inner: Array<{ path: string; message: string }> = []) {
    super(message);
    this.name = "ValidationError";
    this.inner = inner;
  }
}

class StringSchema {
  private _required = false;
  private _email = false;
  private _regex?: RegExp;
  private _msgRequired = "Required";
  private _msgEmail = "Invalid email";
  private _msgRegex = "Invalid";

  required(msg: string) {
    this._required = true;
    this._msgRequired = msg;
    return this;
  }

  email(msg: string) {
    this._email = true;
    this._msgEmail = msg;
    return this;
  }

  matches(regex: RegExp, msg: string) {
    this._regex = regex;
    this._msgRegex = msg;
    return this;
  }

  async validate(value: any): Promise<string> {
    if (this._required && (value === undefined || value === "")) {
      throw new Error(this._msgRequired);
    }
    if (this._email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error(this._msgEmail);
    }
    if (this._regex && value && !this._regex.test(value)) {
      throw new Error(this._msgRegex);
    }
    return value;
  }
}

class ObjectSchema {
  constructor(private shape: Record<string, any>) {}

  async validate(obj: Record<string, any>, opts?: { abortEarly?: boolean }) {
    const errors: Array<{ path: string; message: string }> = [];
    const result: Record<string, any> = {};
    for (const key of Object.keys(this.shape)) {
      try {
        result[key] = await this.shape[key].validate(obj[key]);
      } catch (e: any) {
        errors.push({ path: key, message: e.message });
        if (opts?.abortEarly !== false) break;
      }
    }
    if (errors.length) {
      throw new ValidationError(errors[0].message, errors);
    }
    return result;
  }
}

export function string() {
  return new StringSchema();
}

export function object() {
  return {
    shape: (shape: Record<string, any>) => new ObjectSchema(shape),
  };
}
