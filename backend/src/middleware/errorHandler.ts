import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  error: string;
  details?: any;
  stack?: string;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    res.status(400).json({
      error: 'Validation Error',
      details: errors
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    res.status(400).json({
      error: `Duplicate ${field}`,
      details: `${field} already exists`
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Token expired'
    });
    return;
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      error: 'Invalid ID format'
    });
    return;
  }

  // Default error
  const response: ErrorResponse = {
    error: err.message || 'Internal Server Error'
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(response);
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
