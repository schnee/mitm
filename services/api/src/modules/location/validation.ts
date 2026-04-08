import { z } from "zod";

const coordinateSchema = z.number().gte(-180).lte(180);

export const locationDraftSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("geolocation"),
    sessionId: z.string().trim().min(1),
    participantId: z.string().trim().min(1),
    lat: coordinateSchema,
    lng: coordinateSchema,
    addressLabel: z.string().trim().min(1).max(180)
  }),
  z.object({
    mode: z.literal("manual"),
    sessionId: z.string().trim().min(1),
    participantId: z.string().trim().min(1),
    lat: coordinateSchema,
    lng: coordinateSchema,
    addressLabel: z.string().trim().min(1).max(180)
  })
]);

export const locationConfirmSchema = z.object({
  sessionId: z.string().trim().min(1),
  participantId: z.string().trim().min(1)
});
