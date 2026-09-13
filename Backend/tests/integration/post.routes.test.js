import request from "supertest";
import app from "../../src/app.js";

describe("post routes", () => {
  test("rejects an invalid pagination limit", async () => {
    const response = await request(app).get("/api/v1/posts?limit=999");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  test("rejects protected writes without a bearer token", async () => {
    const response = await request(app)
      .post("/api/v1/posts")
      .send({ title: "A valid title", body: "A body that is long enough for validation." });

    expect(response.status).toBe(401);
  });
});
