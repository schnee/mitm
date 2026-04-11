import { z } from "zod";

export const willingnessSplitSchema = z.enum(["50_50", "60_40", "70_30"]);
export const preferenceTagSchema = z.enum(["coffee", "lunch", "dinner", "cocktails", "dessert", "museum", "walk_and_talk", "vintage_shops", "quiet"]);

export const rankingInputsSchema = z.object({
  sessionId: z.string().trim().min(1),
  participantId: z.string().trim().min(1),
  split: willingnessSplitSchema,
  tags: z.array(preferenceTagSchema).max(5).refine((tags) => new Set(tags).size === tags.length, {
    message: "Tags must be unique"
  })
});

export const rankingResultsSchema = z.object({
  sessionId: z.string().trim().min(1)
});
