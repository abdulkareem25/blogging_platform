export const ROLES = {
  USER: "user",
  ADMIN: "admin",
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
};

export const SORT_OPTIONS = {
  NEWEST: "newest",
  OLDEST: "oldest",
};

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
};

export default {
  ROLES,
  PAGINATION,
  SORT_OPTIONS,
  COOKIE_OPTIONS,
  FILE_LIMITS,
};
