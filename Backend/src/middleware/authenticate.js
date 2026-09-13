import jwt from "jsonwebtoken";
import config from "../config/index.js";
import ApiError from "../utils/ApiError.js";

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    req.user = jwt.verify(token, config.accessTokenSecret);
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

export default authenticate;
