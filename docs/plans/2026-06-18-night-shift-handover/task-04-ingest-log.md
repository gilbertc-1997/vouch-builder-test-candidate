# Task 4: Ingest the free-text night log (`ingestLog`)

← [Task 3 — Ingest JSON](task-03-ingest-json.md) · [Index](README.md) · Next: [Task 5 — Category](task-05-category.md)

Parse the markdown log into one `NormalizedEvent` per bullet. Derive `shiftDate` from the section header ("morning Thu 28 May"); year is passed in (derived from the JSON dataset in Task 11). Extract a room number via regex when present (else `null` — never guessed). Status is inferred from coarse keyword cues, defaulting to `unresolved` (fail-safe: surfaces rather than hides). Translation and flagging happen in later stages, not here.

**Files:**
- Modify: `src/ingest.ts` (append; created in Task 3)
- Create: `src/__tests__/ingest.log.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { ingestLog } from "../ingest";

const log = `# Night logs

## Night of Wed 27 May -> morning Thu 28 May (relief cover)

Intro line, not a bullet.

- Room 112 aircon — compressor needs ordering, stays out of order for now.
- 312 那个 no-show — 我已经按 booking terms 帮他收了一晚的费用了，这件事 settle 了。
- Someone called about wifi dropping, couldn't catch which room it was.
`;

describe("ingestLog", () => {
  const events = ingestLog(log, 2026);

  it("creates one event per bullet, skipping prose", () => {
    expect(events).toHaveLength(3);
  });
  it("derives the shift morning from the header", () => {
    expect(events.every((e) => e.shiftDate === "2026-05-28")).toBe(true);
  });
  it("extracts a room when present and leaves it null otherwise", () => {
    expect(events[0].room).toBe("112");
    expect(events[2].room).toBeNull();
  });
  it("keeps original text verbatim and tags source", () => {
    expect(events[1].text).toContain("我已经按 booking terms");
    expect(events[1].source).toBe("log");
    expect(events[1].sourceRef.source).toBe("log");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/ingest.log.test.ts`
Expected: FAIL — "ingestLog is not exported".

- [ ] **Step 3: Write minimal implementation** (append to `src/ingest.ts`)

```ts
// src/ingest.ts (append)
import type { RawStatus } from "./types";

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// "morning Thu 28 May" -> "2026-05-28"
export function parseLogMorning(text: string, year: number): string | null {
  const m = text.match(/morning\s+\w+\s+(\d{1,2})\s+([A-Za-z]{3,})/i);
  if (!m) return null;
  const day = Number.parseInt(m[1], 10);
  const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferStatus(text: string): RawStatus {
  const t = text.toLowerCase();
  if (/resolved|sorted itself|settle|fixed|收了.*费用了|already charged/.test(t)) return "resolved";
  if (/still|not fixed|not settled|chase|no one came|never came|please/.test(t)) return "unresolved";
  return "unresolved"; // fail-safe default: surface, do not hide
}

export function ingestLog(markdown: string, year: number): NormalizedEvent[] {
  const lines = markdown.split(/\r?\n/);
  let morning: string | null = null;
  let counter = 0;
  const events: NormalizedEvent[] = [];

  lines.forEach((line, idx) => {
    const headerMorning = parseLogMorning(line, year);
    if (headerMorning) morning = headerMorning;

    const bullet = line.match(/^\s*-\s+(.*)$/);
    if (!bullet) return;
    const body = bullet[1].trim();
    if (!body) return;

    counter += 1;
    const roomMatch = body.match(/\b(\d{3})\b/);
    const shiftDate = morning ?? `${year}-01-01`;
    const id = `log_${shiftDate}_${counter}`;
    events.push({
      id,
      source: "log",
      timestamp: `${shiftDate}T07:00:00+08:00`, // shift-end stamp; prose has no precise time
      shiftDate,
      room: roomMatch ? roomMatch[1] : null,
      guest: null,
      type: "log_note",
      text: body,
      status: inferStatus(body),
      sourceRef: { source: "log", id, line: idx + 1 },
    });
  });

  return events;
}
```

> Note: `NormalizedEvent` is already imported at the top of `src/ingest.ts` from Task 3. If your import there is `import type { EventsFile, NormalizedEvent } from "./types";`, you only need to add `RawStatus` to it and can drop the second import line above.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/ingest.log.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ingest.ts src/__tests__/ingest.log.test.ts
git commit -m "feat: ingest free-text night log into normalized events"
```
