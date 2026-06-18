# AI Conversation Export

A representative, lightly-edited walkthrough of how this service was actually built with
Claude Code. Prompts are cleaned up for readability; the flow, decisions, and debugging are
faithful to the real session. It's organized in three phases — **plan**, **build**, **ship** —
because that's how the work actually went.

---

## Phase 1 — Brainstorm & design (decide before writing code)

> **Me:** Read `BRIEF.md` and the `data/` folder, then give me a list of what needs to be
> done and what features we *could* add. Ask me before deciding anything.

We explored the brief together, then I steered the key constraints one at a time rather than
letting the AI guess:

> **Me:** Is it possible to do this with no API key — but still keep the Chinese sentences
> translated?

This was the pivotal design question. Options were laid out (cloud LLM vs. local model vs.
drop translation). I chose:

> **Me:** Go with option A — no key, a local translation model, deterministic parsing.

The rest of the scope fell out of follow-up decisions, each made deliberately:

- **Frontend:** React.
- **Reconciliation:** stateless — recompute the whole picture from full history on every
  request, rather than storing a per-night diff. Simpler and far easier to prove grounded.
- **Severity:** I pushed for a clear, written rule set —

> **Me:** How do we actually determine severity? … Add that decision into the design doc.

The result was a deterministic severity model (compliance/safety open → act now; money +
deadline → act now; flagged items can never be silently buried) written down *before* any
code existed.

> **Me:** Looks good — move to writing the plans.

**Why I work this way:** locking the design in a doc first is what kept the AI honest later.
Every later task pointed back to an agreed decision, so there was no room to drift or invent.

---

## Phase 2 — Plan, then execute task-by-task (TDD)

The design became a task-by-task implementation plan in `docs/plans/`, then I executed it one
task at a time, each as its own commit:

```
types → shift-date-math → ingest(JSON+prose) → category → translation →
reconcile → flags → score → render → pipeline → server → web → deploy → docs
```

Each task followed the same loop: **write the failing test → run it red → minimal
implementation → run it green → commit.** The grounding-critical pieces got their own tests:

- The room 112 aircon thread must link across three nights (JSON → prose → JSON).
- The planted prompt injection (`evt_0026`) must surface as `needs_review` and **never**
  land in the "all clear" bucket.
- Every handover item must carry a source ref that resolves to a real event.

**What I'm proudest of:** the grounding guardrail is structural, not hopeful. The only model
in the system is a text→text translator, so no event text ever reaches an instruction
follower — the injection attack is *architecturally* unable to change behavior, and a test
proves it.

---

## Phase 3 — Ship it (where the real debugging happened)

Deployment, not the logic, was the hard part — and it's the clearest picture of how I debug. We compared free options; I picked Render's free tier. Then the deployed endpoint started
failing:

> **Me:** `GET /handover` → 502 Bad Gateway.

I treated it as a real investigation rather than guessing. We probed the endpoints directly:
`/health` returned 200 in 0.7s, but `/handover` 502'd after ~16s. That split was the clue —
the server was alive; something *in the handover path* was loading the heavy ONNX model and
either timing out past the proxy limit or OOM-ing the 512MB instance.

First fix: a `SKIP_TRANSLATION` flag + `render.yaml` env var. Still 502. **The surprise:** a
*manually connected* Render service ignores `render.yaml` entirely, so the env var never
reached runtime. The reliable fix was to bake the flag into the **Dockerfile**, which is
always read from the built image.

I then verified the live URL actually returned 200 with the right counts before calling it
done — and noted the first-request-after-idle cold start so it wouldn't look like a
regression.

There was also a repo mix-up worth showing, because it's honest about how iteration really
goes:

> **Me:** Render connected to the wrong repo — push everything to my fork.

**Why I work this way:** I read the actual signals (`/health` vs `/handover`, the 16s
timing) instead of changing things at random, and I confirmed the fix against the live
service rather than assuming the deploy worked.

---

## What this shows about how I work

- **Decide first, write second.** A short design doc and a task plan up front made the AI
  measurably better — less hallucination (every task had explicit files, types, and tests)
  and tighter scope (anything not in a task didn't get built).
- **Grounding as an invariant, not a hope.** Source refs on every item, contradictions and
  missing data flagged rather than smoothed over, and injection text treated as data — all
  enforced by tests.
- **Debug from evidence.** Probe, read the signal, form a hypothesis, fix the real cause,
  verify against the live system.
- **Honest tradeoffs.** Translation is built and tested but disabled on the free-tier demo;
  that's documented plainly in `DECISIONS.md` rather than hidden.
