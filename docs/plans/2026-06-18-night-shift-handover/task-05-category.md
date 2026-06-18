# Task 5: Category + deadline detection

← [Task 4 — Ingest log](task-04-ingest-log.md) · [Index](README.md) · Next: [Task 6 — Translation](task-06-translation.md)

**Files:**
- Create: `src/category.ts`, `src/__tests__/category.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/category.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/category.ts
import type { Category, NormalizedEvent } from "./types";

export function categoryOf(e: NormalizedEvent): Category {
  const t = `${e.type} ${e.text}`.toLowerCase();
  if (e.type === "compliance" || /immigration|passport|scan/.test(t)) return "compliance";
  if (/leak|water|fire|unwell|ambulance|medical|injur|security|保险箱|safe\b|lockbox/.test(t)) return "safety";
  if (
    ["deposit_issue", "finance_note", "damage_report", "no_show"].includes(e.type) ||
    /deposit|charge|refund|invoice|damage|no-show|sgd|费用/.test(t)
  ) return "financial";
  if (e.type === "maintenance" || /aircon|compressor|repair|out of order/.test(t)) return "maintenance";
  if (e.type === "complaint" || /noise|wifi|breakfast|complain/.test(t)) return "guest_experience";
  return "informational";
}

export function hasDeadline(text: string): boolean {
  return /48 hours|checks? out tomorrow|tomorrow morning|leaving \d|before checkout|deadline|cutoff|赶飞机|flight/i.test(
    text,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/category.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/category.ts src/__tests__/category.test.ts
git commit -m "feat: category + deadline detection"
```
