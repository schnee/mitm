import { describe, expect, it } from "vitest";
import { SessionProgressBar } from "./SessionProgressBar";
import { NextActionRail } from "./NextActionRail";

describe("session rails contracts", () => {
  it("exports sticky progress and next-action components", () => {
    expect(SessionProgressBar).toBeTypeOf("function");
    expect(NextActionRail).toBeTypeOf("function");
  });
});
