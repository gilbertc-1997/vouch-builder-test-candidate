# Task 2: Night-shift date math (`shiftMorning`)

← [Task 1 — Shared types](task-01-types.md) · [Index](README.md) · Next: [Task 3 — Ingest JSON](task-03-ingest-json.md)

A night shift (~23:00–07:00) spans two calendar dates. We label each event with the **morning the shift ends on**. Wall-clock hour ≥ 12 (the evening/night-start half) belongs to the *next* day's morning; hour < 12 (after-midnight half) belongs to the *same* day.

**Files:**
- Create: `src/shift.ts`, `src/__tests__/shift.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/shift.test.ts`
Expected: FAIL — "Failed to resolve import '../shift'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/shift.ts
// Uses the wall-clock time as written in the ISO string (the hotel's own offset),
// so we never depend on the server's local timezone.
export function shiftMorning(iso: string): string {
  const datePart = iso.slice(0, 10);            // YYYY-MM-DD
  const hour = Number.parseInt(iso.slice(11, 13), 10);
  if (Number.isNaN(hour)) {
    throw new Error(`shiftMorning: cannot parse hour from "${iso}"`);
  }
  if (hour < 12) return datePart;
  const d = new Date(`${datePart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/shift.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shift.ts src/__tests__/shift.test.ts
git commit -m "feat: shift-morning date math for cross-midnight shifts"
```
