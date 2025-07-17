import { z } from "zod";
import { fileSchema } from "./createProjectSchema";

export const updateProjectSchema = z.object({
  title: z.string().trim().min(3, "Title too short"),
  description: z.string().trim().min(10, "Description too short").max(1000, "Description too long"),
  techStack: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional().default([]),
});

export const updateScreenshotsSchema = z.object({
  screenshots: z
    .array(fileSchema)
    .min(1, "At least one screenshot is required")
    .max(10, "Maximum 10 screenshots allowed"),
});
