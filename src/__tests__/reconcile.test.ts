import { describe, it, expect } from "vitest";
import { reconcile } from "../reconcile";
import type { NormalizedEvent } from "../types";

function ev(p: Partial<NormalizedEvent> & { id: string }): NormalizedEvent {
  return {
    source: "json", timestamp: `${p.shiftDate}T02:00:00+08:00`,
    room: null, guest: null, type: "maintenance", text: "", status: "unresolved",
    sourceRef: { source: "json", id: p.id }, shiftDate: "2026-05-26", ...p,
  } as NormalizedEvent;
}

describe("reconcile", () => {
  const aircon1 = ev({ id: "a1", room: "112", type: "maintenance", text: "aircon out of order", shiftDate: "2026-05-26", status: "unresolved" });
  const aircon2 = ev({ id: "a2", room: "112", type: "maintenance", text: "aircon compressor ordered, still out of order", shiftDate: "2026-05-30", status: "unresolved" });
  const leakOpen = ev({ id: "l1", room: "215", type: "facilities", text: "water leak", shiftDate: "2026-05-27", status: "unresolved" });
  const leakFixed = ev({ id: "l2", room: "215", type: "facilities", text: "leak stopped, resolved", shiftDate: "2026-05-29", status: "resolved" });
  const newNoise = ev({ id: "n1", room: "305", type: "complaint", text: "noise", shiftDate: "2026-05-30", status: "unresolved" });

  const all = [aircon1, aircon2, leakOpen, leakFixed, newNoise];

  it("links same room+category across nights into one thread", () => {
    const threads = reconcile(all, "2026-05-30");
    const aircon = threads.find((t) => t.room === "112");
    expect(aircon?.events.map((e) => e.id)).toEqual(["a1", "a2"]);
  });
  it("marks a carried-over open issue still_open", () => {
    const t = reconcile(all, "2026-05-30").find((t) => t.room === "112");
    expect(t?.classification).toBe("still_open");
  });
  it("marks a tonight-only open issue new_tonight", () => {
    const t = reconcile(all, "2026-05-30").find((t) => t.room === "305");
    expect(t?.classification).toBe("new_tonight");
  });
  it("marks an overnight resolution newly_resolved", () => {
    const t = reconcile(all, "2026-05-29").find((t) => t.room === "215");
    expect(t?.classification).toBe("newly_resolved");
  });
  it("omits issues resolved before the target morning", () => {
    const t = reconcile(all, "2026-05-30").find((t) => t.room === "215");
    expect(t).toBeUndefined();
  });
  it("ignores events from after the target morning", () => {
    const t = reconcile(all, "2026-05-26").find((t) => t.room === "112");
    expect(t?.events.map((e) => e.id)).toEqual(["a1"]);
    expect(t?.classification).toBe("new_tonight");
  });
});
