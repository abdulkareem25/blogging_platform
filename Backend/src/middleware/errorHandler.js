const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  if (process.env.NODE_ENV !== "production") console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  // Duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with that value already exists";
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : message,
    errors,
  });
};

export default errorMiddleware;