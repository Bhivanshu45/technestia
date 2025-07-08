import { z } from "zod";

export const verifyOtpSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  otp: z
    .string()
    .length(6, "Verification code must be exactly 6 characters long"),
});
