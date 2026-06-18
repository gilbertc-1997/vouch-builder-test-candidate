import { describe, it, expect } from "vitest";
import { containsCJK, translateEvents } from "../lang";
import type { NormalizedEvent } from "../types";

function ev(text: string): NormalizedEvent {
  return {
    id: "x", source: "log", timestamp: "2026-05-28T07:00:00+08:00",
    shiftDate: "2026-05-28", room: null, guest: null, type: "log_note",
    text, status: "unresolved", sourceRef: { source: "log", id: "x" },
  };
}

describe("containsCJK", () => {
  it("detects Chinese", () => expect(containsCJK("保险箱打不开了")).toBe(true));
  it("ignores pure English", () => expect(containsCJK("aircon broken")).toBe(false));
});

describe("translateEvents", () => {
  it("translates only CJK events and preserves the original", async () => {
    const fake = async (s: string) => `EN(${s})`;
    const out = await translateEvents([ev("保险箱打不开了"), ev("aircon broken")], fake);
    expect(out[0]!.translatedText).toBe("EN(保险箱打不开了)");
    expect(out[0]!.text).toBe("保险箱打不开了"); // original intact
    expect(out[1]!.translatedText).toBeUndefined();
  });
});
