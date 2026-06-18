import { describe, it, expect } from "vitest";
import { shiftMorning } from "../shift";

describe("shiftMorning", () => {
  it("maps a late-evening event to the next morning", () => {
    expect(shiftMorning("2026-05-25T23:14:00+08:00")).toBe("2026-05-26");
  });
  it("maps an after-midnight event to the same morning", () => {
    expect(shiftMorning("2026-05-26T03:10:00+08:00")).toBe("2026-05-26");
  });
  it("groups both halves of one shift onto the same morning", () => {
    expect(shiftMorning("2026-05-26T23:50:00+08:00")).toBe("2026-05-27"); // evt_0006
    expect(shiftMorning("2026-05-27T00:15:00+08:00")).toBe("2026-05-27"); // evt_0007
  });
  it("handles month rollover", () => {
    expect(shiftMorning("2026-05-31T23:30:00+08:00")).toBe("2026-06-01");
  });
});
