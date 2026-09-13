import paginationMeta from "../../src/utils/pagination.js";

test("pagination reports the previous page correctly", () => {
  expect(paginationMeta(0, 1, 20).hasPrevPage).toBe(false);
  expect(paginationMeta(41, 2, 20).hasNextPage).toBe(true);
  expect(paginationMeta(41, 2, 20).hasPrevPage).toBe(true);
});
