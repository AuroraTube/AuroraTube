export class HttpError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = Number(statusCode) || 500;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const notFound = (message, details) => new HttpError(404, message, details);
export const unavailable = (message, details) => new HttpError(503, message, details);
