import { describe, it, expect } from "vitest";
import { categoryOf, hasDeadline } from "../category";
import type { NormalizedEvent } from "../types";

function ev(partial: Partial<NormalizedEvent>): NormalizedEvent {
  return {
    id: "x", source: "json", timestamp: "2026-05-27T02:00:00+08:00",
    shiftDate: "2026-05-27", room: null, guest: null, type: "note",
    text: "", status: "unresolved", sourceRef: { source: "json", id: "x" },
    ...partial,
  };
}

describe("categoryOf", () => {
  it("classifies compliance", () => {
    expect(categoryOf(ev({ type: "compliance", text: "passport not scanned" }))).toBe("compliance");
  });
  it("classifies safety from a leak", () => {
    expect(categoryOf(ev({ type: "facilities", text: "Water leak in corridor" }))).toBe("safety");
  });
  it("classifies safety from a Chinese safe-lockout note", () => {
    expect(categoryOf(ev({ type: "log_note", text: "房间的保险箱打不开了" }))).toBe("safety");
  });
  it("classifies financial", () => {
    expect(categoryOf(ev({ type: "deposit_issue", text: "deposit declined" }))).toBe("financial");
  });
  it("classifies maintenance", () => {
    expect(categoryOf(ev({ type: "maintenance", text: "aircon out of order" }))).toBe("maintenance");
  });
  it("falls back to informational", () => {
    expect(categoryOf(ev({ type: "note", text: "holding a parcel" }))).toBe("informational");
  });
});

describe("hasDeadline", () => {
  it("detects explicit deadlines", () => {
    expect(hasDeadline("reporting deadline is 48 hours from check-in")).toBe(true);
    expect(hasDeadline("guest checks out tomorrow morning")).toBe(true);
    expect(hasDeadline("guest leaving 05:30")).toBe(true);
  });
  it("returns false when no deadline phrase is present", () => {
    expect(hasDeadline("noise complaint, resolved")).toBe(false);
  });
});
