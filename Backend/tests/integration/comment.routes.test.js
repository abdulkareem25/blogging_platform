import request from "supertest";
import app from "../../src/app.js";

test("returns the API health response", async () => {
  const response = await request(app).get("/");

  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    success: true,
    message: "Welcome to the Blogging Platform API",
  });
});
