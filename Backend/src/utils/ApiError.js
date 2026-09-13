class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.name = "ApiError";
  }
}

export default ApiError;
