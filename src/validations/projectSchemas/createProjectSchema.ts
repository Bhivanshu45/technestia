import { z } from "zod";

export const fileSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  buffer: z.string().min(1),
});

export const createProjectSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10).max(1000),
  techStack: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)).optional(),
  status: z.enum(["IDEA", "IN_PROGRESS", "COMPLETED"]).default("IDEA"),
  isPublic: z.boolean().optional().default(false),
  githubUrl: z.string().url().nullable().or(z.literal("")),
  liveDemoUrl: z.string().url().nullable().or(z.literal("")),
  screenshots: z.array(fileSchema).optional(),
});