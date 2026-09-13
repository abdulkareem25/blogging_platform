import ApiError from "../utils/ApiError.js";

const notFoundMiddleware = (req, res, next) => {
  return next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

export default notFoundMiddleware;