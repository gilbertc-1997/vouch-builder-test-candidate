import { describe, it, expect } from "vitest";
import { severityOf } from "../score";
import type { IssueThread, NormalizedEvent } from "../types";

function ev(p: Partial<NormalizedEvent> & { id: string }): NormalizedEvent {
  return {
    source: "json", timestamp: "2026-05-30T02:00:00+08:00", shiftDate: "2026-05-30",
    room: null, guest: null, type: "note", text: "", status: "unresolved",
    sourceRef: { source: "json", id: p.id }, ...p,
  } as NormalizedEvent;
}
function thread(p: Partial<IssueThread> & { events: NormalizedEvent[] }): IssueThread {
  return {
    threadId: "t", room: null, category: "informational",
    currentStatus: p.events[p.events.length - 1]!.status,
    classification: "new_tonight", flags: [], ...p,
  };
}

describe("severityOf", () => {
  it("compliance + open -> act_now", () => {
    const t = thread({ category: "compliance", events: [ev({ id: "c", text: "passports not scanned" })] });
    expect(severityOf(t).severity).toBe("act_now");
  });
  it("safety + open -> act_now", () => {
    const t = thread({ category: "safety", events: [ev({ id: "s", text: "water leak near room" })] });
    expect(severityOf(t).severity).toBe("act_now");
  });
  it("financial + deadline -> act_now", () => {
    const t = thread({ category: "financial", events: [ev({ id: "f", text: "deposit never collected, checks out tomorrow" })] });
    expect(severityOf(t).severity).toBe("act_now");
  });
  it("financial, no deadline -> pending", () => {
    const t = thread({ category: "financial", events: [ev({ id: "f2", text: "deposit dispute under review" })], currentStatus: "pending" });
    expect(severityOf(t).severity).toBe("pending");
  });
  it("maintenance, scheduled -> pending", () => {
    const t = thread({ category: "maintenance", events: [ev({ id: "m", text: "aircon out of order, vendor scheduled" })] });
    expect(severityOf(t).severity).toBe("pending");
  });
  it("newly_resolved -> fyi", () => {
    const t = thread({ category: "safety", classification: "newly_resolved", currentStatus: "resolved",
      events: [ev({ id: "r", status: "resolved", text: "leak fixed" })] });
    expect(severityOf(t).severity).toBe("fyi");
  });
  it("flagged-for-review item never lands in fyi while open", () => {
    const t = thread({ category: "informational", flags: ["needs_review"],
      currentStatus: "pending", events: [ev({ id: "i", status: "pending", text: "weird note" })] });
    expect(severityOf(t).severity).toBe("pending");
  });
  it("attaches a human-readable reason", () => {
    const t = thread({ category: "compliance", events: [ev({ id: "c2", text: "passport scan pending" })] });
    expect(severityOf(t).severityReason.length).toBeGreaterThan(0);
  });
});
