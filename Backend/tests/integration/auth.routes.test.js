import request from "supertest";
import app from "../../src/app.js";

describe("auth routes", () => {
  test("reject invalid registration payloads before database access", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ username: "x", email: "invalid", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });
});
