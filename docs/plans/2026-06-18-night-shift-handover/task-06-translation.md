# Task 6: Local translation (`lang.ts`)

← [Task 5 — Category](task-05-category.md) · [Index](README.md) · Next: [Task 7 — Reconcile](task-07-reconcile.md)

Isolate the only external model behind an injectable `TranslateFn` so the pipeline stays unit-testable without downloading a model. `translateEvents` translates only events containing CJK characters, sets `translatedText`, and preserves the original text. The `machine_translated` flag itself is attached during flagging/render (Task 8/10) by detecting `translatedText`.

**Files:**
- Create: `src/lang.ts`, `src/__tests__/lang.test.ts`

- [ ] **Step 1: Write the failing test** (uses a fake translator — no model download)

```ts
import { describe, it, expect } from "vitest";
import { containsCJK, translateEvents } from "../lang";
import type { NormalizedEvent } from "../types";

function ev(text: string): NormalizedEvent {
  return {
    id: "x", source: "log", timestamp: "2026-05-28T07:00:00+08:00",
    shiftDate: "2026-05-28", room: null, guest: null, type: "log_note",
    text, status: "unresolved", sourceRef: { source: "log", id: "x" },
  };
}

describe("containsCJK", () => {
  it("detects Chinese", () => expect(containsCJK("保险箱打不开了")).toBe(true));
  it("ignores pure English", () => expect(containsCJK("aircon broken")).toBe(false));
});

describe("translateEvents", () => {
  it("translates only CJK events and preserves the original", async () => {
    const fake = async (s: string) => `EN(${s})`;
    const out = await translateEvents([ev("保险箱打不开了"), ev("aircon broken")], fake);
    expect(out[0].translatedText).toBe("EN(保险箱打不开了)");
    expect(out[0].text).toBe("保险箱打不开了"); // original intact
    expect(out[1].translatedText).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lang.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lang.ts
import type { NormalizedEvent } from "./types";

export type TranslateFn = (text: string) => Promise<string>;

export function containsCJK(text: string): boolean {
  return /[一-鿿]/.test(text);
}

export async function translateEvents(
  events: NormalizedEvent[],
  translate: TranslateFn,
): Promise<NormalizedEvent[]> {
  const out: NormalizedEvent[] = [];
  for (const e of events) {
    if (containsCJK(e.text)) {
      const translatedText = (await translate(e.text)).trim();
      out.push({ ...e, translatedText });
    } else {
      out.push(e);
    }
  }
  return out;
}

// Lazy real translator (loaded only at runtime, never in unit tests).
let _pipe: Promise<(text: string) => Promise<string>> | null = null;
export function getTranslator(): Promise<(text: string) => Promise<string>> {
  if (!_pipe) {
    _pipe = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      const translator = await pipeline("translation", "Xenova/opus-mt-zh-en");
      return async (text: string) => {
        const res = (await translator(text)) as Array<{ translation_text: string }>;
        return res[0]?.translation_text ?? text;
      };
    })();
  }
  return _pipe;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lang.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lang.ts src/__tests__/lang.test.ts
git commit -m "feat: local zh->en translation behind injectable TranslateFn"
```
