import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { _id: userId, role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );

  const refreshToken = jwt.sign(
    { _id: userId, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
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
