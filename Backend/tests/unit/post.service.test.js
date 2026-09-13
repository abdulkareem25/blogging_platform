import paginationMeta from "../../src/utils/pagination.js";
import slugify from "../../src/utils/slugify.js";

describe("post utilities", () => {
  test("creates stable pagination metadata at boundaries", () => {
    expect(paginationMeta(20, 2, 10)).toEqual({
      currentPage: 2,
      totalPages: 2,
      totalItems: 20,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: true,
    });
  });

  test("creates URL-safe slugs with a unique suffix", () => {
    expect(slugify("Hello, Backend World!", "abc123")).toBe("hello-backend-world-abc123");
  });
});
