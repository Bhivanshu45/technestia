import { z } from "zod";

export const createMilestoneSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  completionStatus: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"])
    .optional()
    .default("NOT_STARTED"),
  updateRequest: z.enum(["NO_REQUEST", "PENDING", "APPROVED", "REJECTED"])
    .optional()
    .default("NO_REQUEST"),
  proofUrl: z
    .string()
    .url("Proof URL must be a valid URL")
    .optional()
    .or(z.literal("")),
  isPublic: z.boolean().optional().default(false),
});
