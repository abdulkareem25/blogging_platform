import { nanoid } from "nanoid";

export const slugify = (value = "", suffix = nanoid(8)) => {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "post";

  return `${base}-${suffix}`;
};

export default slugify;