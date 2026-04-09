import { z } from "zod";

export const shortlistVenueSchema = z.object({
  sessionId: z.string().min(1),
  participantId: z.string().min(1),
  venueId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  openNow: z.boolean().nullable(),
  lat: z.number(),
  lng: z.number(),
  etaParticipantA: z.number().nonnegative(),
  etaParticipantB: z.number().nonnegative()
});

export const confirmVenueSchema = z.object({
  sessionId: z.string().min(1),
  participantId: z.string().min(1),
  venueId: z.string().min(1)
});
