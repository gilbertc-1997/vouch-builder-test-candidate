# Task 15: Deliverable docs (`DECISIONS.md`, README, CLAUDE.md commands)

← [Task 14 — Deploy](task-14-deploy.md) · [Index](README.md)

**Files:**
- Create: `DECISIONS.md`
- Modify: `README.md` (add run + curl instructions), `CLAUDE.md` (fill in the now-real commands)

- [ ] **Step 1: Write `DECISIONS.md`** covering every required point

```markdown
# DECISIONS

## What I built / deliberately skipped
Built: dual-format ingest, cross-night reconciliation, severity-ranked grounded handover,
local (no-key) translation, deterministic trust-flagging (contradiction / missing data /
prompt-injection), JSON API + plain React view, structured per-request logging, Render deploy.
Skipped (and why): persisted per-night state (stateless recompute is simpler and provably
grounded for a 2-hour slice); confidence scores; multi-hotel batch; auth.

## Reconciliation across nights
Stateless: `(full history, target morning) -> handover`. Events are labelled with the morning
their shift ends on, grouped into threads by room+category (room-less events by category), and
each thread is classified still_open / newly_resolved / new_tonight relative to the target
morning. Items resolved before the target morning are dropped so we never re-report closed work.

## Grounding & messy input
No event text ever reaches an instruction-following model — the only model is a text->text
translator — so prompt injection (evt_0026) cannot change behaviour; it is surfaced as
`needs_review`. Every handover item is built from source fields and carries >=1 source ref;
a test asserts every ref resolves to a real event and that the injected note is never reported
all-clear. Missing data (e.g. the unidentifiable wifi room) is flagged, never guessed.
Contradictions (312 charge dispute; room 205 in-house vs. empty) are flagged, not resolved.

## Where AI helped / got in the way
[Fill in honestly from the build session.]

## Hours 3–6
LLM-assisted extraction (with the same grounding guardrails) for richer prose; per-item
confidence; smarter thread linking; eval set across more nights; auth + multi-hotel.

## One surprise
[Fill in honestly from the build session.]
```

> The two bracketed lines ("Where AI helped / got in the way", "One surprise") are intentional —
> they can only be filled honestly from the real build session. Replace them before submitting.

- [ ] **Step 2: Append run instructions to `README.md`**

```markdown

## Running locally

    npm install
    npm test           # full TDD suite
    npm run dev        # API on http://localhost:8080
    # in web/: npm install && npm run dev   # React view on http://localhost:5173

## Generate a handover

    curl -s "http://localhost:8080/handover?date=2026-05-30"

Deployed:

    curl -s "https://<your-app>.onrender.com/handover?date=2026-05-30"
```

- [ ] **Step 3: Update the "no toolchain yet" section of `CLAUDE.md`** with the real commands

Replace the `## Repository status` paragraph that says build/lint/test commands don't exist yet with a `## Commands` section:

```markdown
## Commands

- `npm install` — backend deps
- `npm test` — run the Vitest suite (`npm run test:watch` to watch)
- `npx vitest run src/__tests__/<file>.test.ts` — run a single test file
- `npm run dev` — API with reload on http://localhost:8080
- `npm run typecheck` — type-only check
- `npm run build` — build the React view into `web/dist`
- `npm start` — run the server (serves API + built view)
```

- [ ] **Step 4: Final full verification**

Run: `npm test && npm run typecheck`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add DECISIONS.md README.md CLAUDE.md
git commit -m "docs: DECISIONS.md, run instructions, real CLAUDE.md commands"
```
