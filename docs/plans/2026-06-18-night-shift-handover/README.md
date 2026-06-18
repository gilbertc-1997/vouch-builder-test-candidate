# Night-Shift Handover Service — Task Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Each task lives in its own file below and uses checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable service that turns messy hotel front-desk data (structured JSON + multilingual free-text prose) into an action-first, fully grounded night-shift handover for the morning manager.

**Architecture:** A pure-function pipeline (ingest → translate → reconcile → flag → score → render) wrapped in a Fastify JSON API, with a plain React (Vite) view over the JSON. Reconciliation is stateless: `(full history, target date) → handover`. No hosted LLM — Chinese is translated by a local `transformers.js` model; all reasoning is deterministic so grounding is provable and prompt-injection cannot hijack logic.

**Tech Stack:** Node 20, TypeScript, Fastify, `@xenova/transformers` (local zh→en MT), Vitest (TDD), Vite + React, Docker, Fly.io.

**Design spec:** [`../2026-06-18-night-shift-handover-design.md`](../2026-06-18-night-shift-handover-design.md)
**Master plan (single file):** [`../2026-06-18-night-shift-handover-implementation.md`](../2026-06-18-night-shift-handover-implementation.md)

## Execute tasks in order

| # | Task | File |
|---|------|------|
| 0 | Project scaffold | [task-00-scaffold.md](task-00-scaffold.md) |
| 1 | Shared types | [task-01-types.md](task-01-types.md) |
| 2 | Night-shift date math | [task-02-shift.md](task-02-shift.md) |
| 3 | Ingest structured events | [task-03-ingest-json.md](task-03-ingest-json.md) |
| 4 | Ingest free-text night log | [task-04-ingest-log.md](task-04-ingest-log.md) |
| 5 | Category + deadline detection | [task-05-category.md](task-05-category.md) |
| 6 | Local translation | [task-06-translation.md](task-06-translation.md) |
| 7 | Reconcile threads + classify | [task-07-reconcile.md](task-07-reconcile.md) |
| 8 | Flagging (injection / contradiction / missing) | [task-08-flags.md](task-08-flags.md) |
| 9 | Severity scoring | [task-09-score.md](task-09-score.md) |
| 10 | Render handover | [task-10-render.md](task-10-render.md) |
| 11 | Pipeline orchestrator + grounding invariants | [task-11-pipeline.md](task-11-pipeline.md) |
| 12 | Fastify server + structured logging | [task-12-server.md](task-12-server.md) |
| 13 | React view | [task-13-web.md](task-13-web.md) |
| 14 | Containerize + Fly.io deploy | [task-14-deploy.md](task-14-deploy.md) |
| 15 | Deliverable docs | [task-15-docs.md](task-15-docs.md) |

## File structure produced

```
package.json              # backend deps + scripts (ESM, run via tsx)
tsconfig.json             # typecheck only (noEmit), Bundler resolution
vitest.config.ts          # test config
Dockerfile                # build web, run backend via tsx
fly.toml                  # Fly.io app config
data/                     # existing sample input (events.json, night-logs.md)
src/
  types.ts                # all shared types
  shift.ts                # shiftMorning() — night-shift date math
  ingest.ts               # ingestJson(), ingestLog()
  lang.ts                 # containsCJK(), translateEvents(), getTranslator()
  category.ts             # categoryOf(), hasDeadline()
  reconcile.ts            # reconcile(), classifyThread()
  flags.ts                # annotateFlags() — contradictions / missing_data / injection
  score.ts                # severityOf()
  render.ts               # buildHandover()
  pipeline.ts             # generateHandover() — orchestrates the above
  server.ts               # Fastify app, routes, structured logging
  __tests__/              # vitest specs (one per module)
web/
  package.json            # frontend deps
  vite.config.ts          # dev proxy + build to web/dist
  index.html
  src/main.tsx
  src/App.tsx
  src/api.ts
  src/styles.css
DECISIONS.md              # required deliverable
```
