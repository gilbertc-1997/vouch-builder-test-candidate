# Task 3: Ingest structured events (`ingestJson`)

← [Task 2 — Shift date math](task-02-shift.md) · [Index](README.md) · Next: [Task 4 — Ingest log](task-04-ingest-log.md)

**Files:**
- Create: `src/ingest.ts`, `src/__tests__/ingest.json.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { ingestJson } from "../ingest";
import type { EventsFile } from "../types";

const sample: EventsFile = {
  hotel: { id: "lumen-sg", name: "Lumen", rooms: 40, timezone: "+08:00" },
  events: [
    { id: "evt_0002", timestamp: "2026-05-26T00:20:00+08:00", type: "maintenance",
      room: "112", guest: "Sarah Wong", description: "Aircon not cooling.", status: "unresolved" },
  ],
};

describe("ingestJson", () => {
  it("normalizes a raw event and preserves a source ref", () => {
    const [e] = ingestJson(sample);
    expect(e).toMatchObject({
      id: "evt_0002", source: "json", room: "112", guest: "Sarah Wong",
      type: "maintenance", text: "Aircon not cooling.", status: "unresolved",
      shiftDate: "2026-05-26",
      sourceRef: { source: "json", id: "evt_0002" },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/ingest.json.test.ts`
Expected: FAIL — "ingestJson is not exported".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/ingest.ts
import type { EventsFile, NormalizedEvent } from "./types";
import { shiftMorning } from "./shift";

export function ingestJson(file: EventsFile): NormalizedEvent[] {
  return file.events.map((e) => ({
    id: e.id,
    source: "json",
    timestamp: e.timestamp,
    shiftDate: shiftMorning(e.timestamp),
    room: e.room,
    guest: e.guest,
    type: e.type,
    text: e.description,
    status: e.status,
    sourceRef: { source: "json", id: e.id },
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/ingest.json.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ingest.ts src/__tests__/ingest.json.test.ts
git commit -m "feat: ingest structured JSON events"
```
