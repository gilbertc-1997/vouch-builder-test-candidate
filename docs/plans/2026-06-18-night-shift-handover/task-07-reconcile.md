# Task 7: Reconcile threads + classify (`reconcile.ts`)

← [Task 6 — Translation](task-06-translation.md) · [Index](README.md) · Next: [Task 8 — Flags](task-08-flags.md)

Group events into issue threads (`room + category`; room-less events thread by `category` alone so the cross-room immigration saga joins up). For a target morning, keep only events known by then, then classify each thread:

- **newly_resolved** — current status `resolved` and the latest known event is on the target shift.
- Resolved *before* the target shift → omitted (don't re-report old closed items).
- **new_tonight** — still open and the thread first appears on the target shift.
- **still_open** — still open and the thread has events from earlier shifts.

**Files:**
- Create: `src/reconcile.ts`, `src/__tests__/reconcile.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/reconcile.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/reconcile.ts
import type { Classification, IssueThread, NormalizedEvent, RawStatus } from "./types";
import { categoryOf } from "./category";

function threadKey(e: NormalizedEvent): string {
  const category = categoryOf(e);
  return e.room ? `${e.room}|${category}` : `noroom|${category}`;
}

function classify(events: NormalizedEvent[], targetDate: string): Classification {
  const status = events[events.length - 1].status;
  const lastShift = events[events.length - 1].shiftDate;
  const firstShift = events[0].shiftDate;
  if (status === "resolved") return "newly_resolved"; // resolved-before-target is filtered out before here
  if (firstShift === targetDate && lastShift === targetDate) return "new_tonight";
  return "still_open";
}

export function reconcile(events: NormalizedEvent[], targetDate: string): IssueThread[] {
  const known = events
    .filter((e) => e.shiftDate <= targetDate)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const groups = new Map<string, NormalizedEvent[]>();
  for (const e of known) {
    const key = threadKey(e);
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const threads: IssueThread[] = [];
  for (const [key, evs] of groups) {
    const currentStatus: RawStatus = evs[evs.length - 1].status;
    const lastShift = evs[evs.length - 1].shiftDate;

    // Don't re-report items closed on an earlier morning.
    if (currentStatus === "resolved" && lastShift !== targetDate) continue;

    threads.push({
      threadId: key,
      room: evs[0].room,
      category: categoryOf(evs[0]),
      events: evs,
      currentStatus,
      classification: classify(evs, targetDate),
      flags: [],
    });
  }
  return threads;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/reconcile.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/reconcile.ts src/__tests__/reconcile.test.ts
git commit -m "feat: reconcile issue threads and classify across nights"
```
