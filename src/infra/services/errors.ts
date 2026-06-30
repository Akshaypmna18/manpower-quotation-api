export class ServiceError extends Error {
  constructor(
    public readonly status: 400 | 403 | 404 | 409 | 500 | 502,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}
