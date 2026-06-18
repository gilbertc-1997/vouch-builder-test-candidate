# Vouch Builder Take-Home

Welcome — thanks for taking the time.

**Start here:** read [`BRIEF.md`](BRIEF.md). It describes the task, what to build,
and how to submit.

Your sample data is in [`data/`](data/):
- `events.json` — structured front-desk events
- `night-logs.md` — one night logged as free text

Timebox is ~2 hours. We're looking for sharp tradeoffs, not completeness. Good luck.

---

## The handover service

A service that turns the messy front-desk data above into an **action-first
night-shift handover**: what's on fire, what's pending, what's FYI — with every
line traced back to a source event.

**Deployed:** https://vouch-builder-test-candidate-o1jv.onrender.com

### Run locally

```sh
npm install
npm test           # full TDD suite (47 tests)
npm run dev        # API on http://localhost:8080
```

For the React view (optional — the API is the grounding contract):

```sh
cd web && npm install && npm run dev   # http://localhost:5173 (proxies to :8080)
```

### Generate a handover

```sh
# local
curl -s "http://localhost:8080/handover?date=2026-05-30"

# deployed (free tier: first hit after idle may 502 — retry ~30s later once the
# machine wakes; translation is disabled on the hosted demo)
curl -s "https://vouch-builder-test-candidate-o1jv.onrender.com/handover?date=2026-05-30"
```

`POST /handover` accepts arbitrary input — `{ events, nightLogs?, date? }` — so the
service can be run against night-log text it has never seen:

```sh
curl -s -X POST http://localhost:8080/handover \
  -H 'content-type: application/json' \
  -d '{"events": <events.json contents>, "nightLogs": "<prose>", "date": "2026-05-30"}'
```
