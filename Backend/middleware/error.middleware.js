class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handlePrismaError = (err) => {
  if (err.code === 'P2002') {
    return new HttpError(`Duplicate field value: ${err.meta.target}`, 400);
  }
  if (err.code === 'P2025') {
    return new HttpError('Record not found', 404);
  }
  return new HttpError('Database operation failed', 500);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new HttpError(message, 400);
};

exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle specific error types
  if (err.name === 'PrismaClientKnownRequestError') {
    err = handlePrismaError(err);
  }
  if (err.name === 'ValidationError') {
    err = handleValidationError(err);
  }
  if (err.name === 'MulterError') {
    err = new HttpError(err.message, 400);
  }

  // Send error response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err.message,
    });
  }

  // Log unexpected errors
  console.error('ERROR 💥', err);

  // Send generic error for non-operational errors
  res.status(500).json({
    status: 'error',
    error: 'Something went wrong',
  });
};

exports.catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

exports.HttpError = HttpError;