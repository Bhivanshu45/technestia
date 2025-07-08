import { z } from "zod";

export const passValidation = z
                    .string()
                    .min(8, { message: "Password must be at least 8 characters long" })
                    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
                    message:
                        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
                    })

export const changePasswordSchema = z.object({
    currentPassword: passValidation,
    newPassword: passValidation,
})