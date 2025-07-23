import { title } from "process";
import { z } from "zod";

export const updateMilestoneSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  proofUrl: z
    .string()
    .url("Proof URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});