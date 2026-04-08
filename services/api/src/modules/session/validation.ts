import { z } from "zod";

export const participantRoleSchema = z.enum(["host", "invitee"]);

export const createSessionRequestSchema = z.object({
  role: participantRoleSchema.default("host"),
  hostName: z.string().trim().min(1).max(80).optional()
});

export const joinSessionRequestSchema = z.object({
  joinToken: z.string().trim().min(10),
  role: participantRoleSchema.default("invitee")
});
