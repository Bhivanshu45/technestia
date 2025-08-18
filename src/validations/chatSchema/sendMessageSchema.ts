import { z } from "zod";

export const sendMessageSchema = z.object({
  messageType: z.enum(["TEXT", "LINK", "IMAGE", "FILE"]),
  content: z.string().optional(),
  file: z
    .object({
      buffer: z.string(),
      type: z.string(),
    })
    .nullable()
    .optional(),
});
