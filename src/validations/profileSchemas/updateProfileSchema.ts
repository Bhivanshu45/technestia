import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(20).optional(),
  bio: z.string().max(500).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
})