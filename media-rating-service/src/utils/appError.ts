export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // You can set this based on whether it's an expected error
    Error.captureStackTrace(this, this.constructor);
  }
}
