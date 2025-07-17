import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

export const settingsSchema = z.object({
  status: z.nativeEnum(ProjectStatus),
  isPublic: z.boolean(),
});
