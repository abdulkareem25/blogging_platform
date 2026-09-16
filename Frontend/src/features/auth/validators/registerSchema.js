import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(30, "Username is too long"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
