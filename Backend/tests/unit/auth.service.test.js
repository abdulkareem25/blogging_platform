import jwt from "jsonwebtoken";
import config from "../../src/config/index.js";
import { generateTokens } from "../../src/utils/token.js";

describe("token utilities", () => {
  test("generates verifiable access and refresh tokens", () => {
    const tokens = generateTokens("507f1f77bcf86cd799439011", "user");

    expect(jwt.verify(tokens.accessToken, config.accessTokenSecret)).toMatchObject({
      _id: "507f1f77bcf86cd799439011",
      role: "user",
    });
    expect(jwt.verify(tokens.refreshToken, config.refreshTokenSecret)).toMatchObject({
      _id: "507f1f77bcf86cd799439011",
      role: "user",
    });
  });
});
