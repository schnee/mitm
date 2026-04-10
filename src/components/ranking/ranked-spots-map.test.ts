import { describe, expect, it } from "vitest";
import { RankedSpotsMap } from "./RankedSpotsMap";

describe("RankedSpotsMap", () => {
  it("exports the map component contract", () => {
    expect(RankedSpotsMap).toBeTypeOf("function");
  });
});
