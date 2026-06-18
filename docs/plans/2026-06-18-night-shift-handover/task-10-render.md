# Task 10: Render the handover (`render.ts`)

← [Task 9 — Score](task-09-score.md) · [Index](README.md) · Next: [Task 11 — Pipeline](task-11-pipeline.md)

Turn scored, flagged threads into the `Handover` object grouped by severity. The summary is built **only** from source text (original or its machine translation) — never invented. Items are ordered within each bucket by category priority.

**Files:**
- Create: `src/render.ts`, `src/__tests__/render.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
    currentStatus: p.events[p.events.length - 1].status,
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
    expect(h.groups.act_now[0].summary).toContain("passport not scanned");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/render.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/render.ts
import type { Category, Handover, HandoverItem, Hotel, IssueThread, Severity } from "./types";
import { severityOf } from "./score";

const CATEGORY_PRIORITY: Record<Category, number> = {
  compliance: 0, safety: 1, financial: 2, maintenance: 3, guest_experience: 4, informational: 5,
};

function toItem(t: IssueThread): HandoverItem {
  const { severity, severityReason } = severityOf(t);
  const latest = t.events[t.events.length - 1];
  const summary = latest.translatedText
    ? `${latest.translatedText}  ·  [original] ${latest.text}`
    : latest.text;
  return {
    threadId: t.threadId,
    severity,
    severityReason,
    classification: t.classification,
    summary: t.room ? `Room ${t.room}: ${summary}` : summary,
    room: t.room,
    sourceRefs: t.events.map((e) => e.sourceRef),
    flags: t.flags,
  };
}

function sortItems(items: HandoverItem[], threadsById: Map<string, IssueThread>): HandoverItem[] {
  return [...items].sort((a, b) => {
    const ca = CATEGORY_PRIORITY[threadsById.get(a.threadId)!.category];
    const cb = CATEGORY_PRIORITY[threadsById.get(b.threadId)!.category];
    return ca - cb;
  });
}

export function buildHandover(threads: IssueThread[], hotel: Hotel, date: string): Handover {
  const byId = new Map(threads.map((t) => [t.threadId, t]));
  const items = threads.map(toItem);
  const bucket = (s: Severity) => sortItems(items.filter((i) => i.severity === s), byId);

  const groups = { act_now: bucket("act_now"), pending: bucket("pending"), fyi: bucket("fyi") };
  const flagCount = items.filter((i) => i.flags.length > 0).length;

  return {
    hotel,
    date,
    generatedAt: new Date().toISOString(),
    counts: {
      act_now: groups.act_now.length,
      pending: groups.pending.length,
      fyi: groups.fyi.length,
      flags: flagCount,
    },
    groups,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/render.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render.ts src/__tests__/render.test.ts
git commit -m "feat: render grounded handover grouped by severity"
```
