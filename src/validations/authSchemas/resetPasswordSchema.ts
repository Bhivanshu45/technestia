import { z } from "zod";

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  token: z.string({ message: "Token is required" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});