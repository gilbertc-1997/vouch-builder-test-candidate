# Task 11: Pipeline orchestrator + grounding invariants (`pipeline.ts`)

← [Task 10 — Render](task-10-render.md) · [Index](README.md) · Next: [Task 12 — Server](task-12-server.md)

Compose every stage into one async function, and add the **grounding invariant test** against the real sample data — the single most important test in the suite.

**Files:**
- Create: `src/pipeline.ts`, `src/__tests__/pipeline.grounding.test.ts`

- [ ] **Step 1: Write `src/pipeline.ts`**

```ts
// src/pipeline.ts
import type { EventsFile, Handover, NormalizedEvent } from "./types";
import { ingestJson, ingestLog } from "./ingest";
import { translateEvents, getTranslator, type TranslateFn } from "./lang";
import { reconcile } from "./reconcile";
import { annotateFlags } from "./flags";
import { buildHandover } from "./render";

export interface PipelineInput {
  events: EventsFile;
  nightLogs?: string;
  date?: string;             // target morning; defaults to latest known shift
  translate?: TranslateFn;   // injectable; defaults to the local model
}

function defaultYear(events: NormalizedEvent[]): number {
  const years = events.map((e) => Number.parseInt(e.shiftDate.slice(0, 4), 10));
  return years.sort((a, b) => b - a)[0] ?? new Date().getUTCFullYear();
}

function latestShift(events: NormalizedEvent[]): string {
  return events.map((e) => e.shiftDate).sort().at(-1) ?? new Date().toISOString().slice(0, 10);
}

export async function generateHandover(input: PipelineInput): Promise<Handover> {
  const jsonEvents = ingestJson(input.events);
  const year = defaultYear(jsonEvents);
  const logEvents = input.nightLogs ? ingestLog(input.nightLogs, year) : [];
  const merged = [...jsonEvents, ...logEvents];

  const translate = input.translate ?? (await getTranslator());
  const translated = await translateEvents(merged, translate);

  const targetDate = input.date ?? latestShift(translated);
  const threads = annotateFlags(reconcile(translated, targetDate), translated);
  return buildHandover(threads, { id: input.events.hotel.id, name: input.events.hotel.name }, targetDate);
}
```

- [ ] **Step 2: Write the grounding-invariant test** (uses a passthrough translator — no model download)

```ts
// src/__tests__/pipeline.grounding.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateHandover } from "../pipeline";
import type { EventsFile } from "../types";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const events = JSON.parse(readFileSync(join(root, "data/events.json"), "utf8")) as EventsFile;
const nightLogs = readFileSync(join(root, "data/night-logs.md"), "utf8");
const passthrough = async (s: string) => s; // deterministic, offline

describe("grounding invariants (real sample data)", () => {
  it("produces a handover for the last morning", async () => {
    const h = await generateHandover({ events, nightLogs, date: "2026-05-30", translate: passthrough });
    const all = [...h.groups.act_now, ...h.groups.pending, ...h.groups.fyi];
    expect(all.length).toBeGreaterThan(0);

    const validIds = new Set([...events.events.map((e) => e.id)]);
    for (const item of all) {
      // 1. every item is grounded
      expect(item.sourceRefs.length).toBeGreaterThanOrEqual(1);
      // 2. json refs must point to a real event; log refs are synthesized log_*
      for (const ref of item.sourceRefs) {
        if (ref.source === "json") expect(validIds.has(ref.id)).toBe(true);
        else expect(ref.id.startsWith("log_")).toBe(true);
      }
    }
  });

  it("surfaces the prompt-injection note for review and never as all-clear", async () => {
    const h = await generateHandover({ events, nightLogs, date: "2026-05-30", translate: passthrough });
    const all = [...h.groups.act_now, ...h.groups.pending, ...h.groups.fyi];
    const injected = all.find((i) => i.sourceRefs.some((r) => r.id === "evt_0026"));
    expect(injected).toBeDefined();
    expect(injected!.flags).toContain("needs_review");
    expect(injected!.severity).not.toBe("fyi");
  });

  it("classifies the room 112 aircon thread as still_open across nights", async () => {
    const h = await generateHandover({ events, nightLogs, date: "2026-05-30", translate: passthrough });
    const all = [...h.groups.act_now, ...h.groups.pending, ...h.groups.fyi];
    const aircon = all.find((i) => i.room === "112");
    expect(aircon?.classification).toBe("still_open");
  });
});
```

- [ ] **Step 3: Run the grounding test**

Run: `npx vitest run src/__tests__/pipeline.grounding.test.ts`
Expected: PASS (3 tests). If a classification assertion fails, fix the reconcile/flag logic — not the test — until the real data is grounded.

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline.ts src/__tests__/pipeline.grounding.test.ts
git commit -m "feat: pipeline orchestrator + grounding invariant tests"
```
