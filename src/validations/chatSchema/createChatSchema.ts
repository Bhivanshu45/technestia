import { z } from "zod";

export const createChatSchema = z.object({
  isGroup: z.boolean(),
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
  projectId: z.number().int().positive().optional(),

  participantIds: z.array(z.number().int().positive()).optional(),

  targetUserId: z.number().int().positive().optional(),
});