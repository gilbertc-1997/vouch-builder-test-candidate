# Task 9: Severity scoring (`score.ts`)

← [Task 8 — Flags](task-08-flags.md) · [Index](README.md) · Next: [Task 10 — Render](task-10-render.md)

Implements the design's severity model: a deterministic rule over `category`, deadline presence, status/classification, and flags, returning a bucket plus `severityReason[]`. Fail-safe: anything still open that doesn't match a rule defaults to `pending`, never `fyi`; flagged items are never `fyi` while open.

**Files:**
- Create: `src/score.ts`, `src/__tests__/score.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
    currentStatus: p.events[p.events.length - 1].status,
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/score.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/score.ts
import type { IssueThread, Severity } from "./types";
import { hasDeadline } from "./category";

export interface Scored { severity: Severity; severityReason: string[]; }

export function severityOf(t: IssueThread): Scored {
  const reasons: string[] = [];
  const resolved = t.currentStatus === "resolved";
  const open = !resolved;
  const deadline = t.events.some((e) => hasDeadline(`${e.text} ${e.translatedText ?? ""}`));
  const blockingFlag =
    t.flags.includes("contradiction") ||
    t.flags.includes("needs_review") ||
    t.flags.includes("missing_data");

  if (resolved && t.classification === "newly_resolved") {
    return { severity: "fyi", severityReason: ["resolved overnight — confirmation only"] };
  }

  let severity: Severity;
  if (open && (t.category === "compliance" || t.category === "safety")) {
    severity = "act_now";
    reasons.push(`${t.category} issue still open`);
  } else if (open && t.category === "financial" && deadline) {
    severity = "act_now";
    reasons.push("money at risk with a deadline");
  } else if (open && deadline) {
    severity = "act_now";
    reasons.push("explicit deadline not yet met");
  } else if (open) {
    severity = "pending";
    reasons.push(t.classification === "still_open" ? "carried over, still open" : "open, no imminent deadline");
  } else {
    severity = "fyi";
    reasons.push("informational");
  }

  // Fail safe: never bury something we could not fully trust while it is open.
  if (severity === "fyi" && open && blockingFlag) {
    severity = "pending";
    reasons.push("flagged for review — kept visible");
  }
  if (blockingFlag) reasons.push(`flags: ${t.flags.join(", ")}`);

  return { severity, severityReason: reasons };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/score.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/score.ts src/__tests__/score.test.ts
git commit -m "feat: deterministic severity scoring with reasons"
```
