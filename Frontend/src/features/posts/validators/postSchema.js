import { z } from "zod";

export const postSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  body: z.string().trim().min(20, "Body must be at least 20 characters"),
  tags: z.string().optional().default(""),
});
