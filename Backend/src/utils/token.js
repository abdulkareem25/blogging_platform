import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

export const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { _id: userId, role },
    config.accessTokenSecret,
    { expiresIn: config.accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    { _id: userId, role },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token, secret) => jwt.verify(token, secret);

export const hashToken = async (token) => bcrypt.hash(token, 12);

export const compareToken = async (token, hash) => bcrypt.compare(token, hash);

export default {
  generateTokens,
  verifyToken,
  hashToken,
  compareToken,
};
