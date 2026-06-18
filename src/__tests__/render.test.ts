import { describe, it, expect } from "vitest";
import { buildHandover } from "../render";
import type { IssueThread, NormalizedEvent } from "../types";

function ev(p: Partial<NormalizedEvent> & { id: string }): NormalizedEvent {
  return {
    source: "json", timestamp: "2026-05-30T02:00:00+08:00", shiftDate: "2026-05-30",
    room: null, guest: null, type: "compliance", text: "", status: "unresolved",
    sourceRef: { source: "json", id: p.id }, ...p,
  } as NormalizedEvent;
}
function thread(p: Partial<IssueThread> & { threadId: string; events: NormalizedEvent[] }): IssueThread {
  return {
    room: null, category: "compliance",
    currentStatus: p.events[p.events.length - 1]!.status,
    classification: "new_tonight", flags: [], ...p,
  };
}

describe("buildHandover", () => {
  const threads = [
    thread({ threadId: "comp", category: "compliance", room: "207",
      events: [ev({ id: "evt_0009", room: "207", text: "passport not scanned" })] }),
    thread({ threadId: "note", category: "informational", classification: "newly_resolved",
      currentStatus: "resolved",
      events: [ev({ id: "evt_0022", type: "note", status: "resolved", text: "holding a parcel" })] }),
  ];
  const h = buildHandover(threads, { id: "lumen-sg", name: "Lumen" }, "2026-05-30");

  it("groups by severity", () => {
    expect(h.groups.act_now.map((i) => i.threadId)).toContain("comp");
    expect(h.groups.fyi.map((i) => i.threadId)).toContain("note");
  });
  it("counts items and flags", () => {
    expect(h.counts.act_now).toBe(1);
    expect(h.counts.fyi).toBe(1);
  });
  it("every item carries at least one source ref", () => {
    const all = [...h.groups.act_now, ...h.groups.pending, ...h.groups.fyi];
    expect(all.every((i) => i.sourceRefs.length >= 1)).toBe(true);
  });
  it("summary is drawn from source text, not invented", () => {
    expect(h.groups.act_now[0]!.summary).toContain("passport not scanned");
  });
});
