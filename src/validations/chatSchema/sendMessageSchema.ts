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
}).refine(
  (data) =>
    (data.messageType === "TEXT" || data.messageType === "LINK")
      ? Boolean(data.content && data.content.trim())
      : Boolean(data.file),
  {
    message: "Message content or file is required",
  }
);
