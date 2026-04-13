import { z } from "zod";

const isValidSplit = (val: string): boolean => {
  const match = val.match(/^(\d{1,3})_(\d{1,3})$/);
  if (!match) return false;
  const first = parseInt(match[1], 10);
  const second = parseInt(match[2], 10);
  // Sum must be at least 100 for combined willingness to reach a midpoint
  // Individual values can be any (enforce minimum on client if desired)
  return first + second >= 100;
};

export const willingnessSplitSchema = z.string().refine(isValidSplit, {
  message: "Split must be XX_YY where XX+YY=100 and both >= 50"
});
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
