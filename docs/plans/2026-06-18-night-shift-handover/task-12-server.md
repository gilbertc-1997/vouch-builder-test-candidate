# Task 12: Fastify server + structured logging (`server.ts`)

← [Task 11 — Pipeline](task-11-pipeline.md) · [Index](README.md) · Next: [Task 13 — Web](task-13-web.md)

Expose the pipeline. `GET /handover?date=` uses the bundled sample (for the `curl` demo); `POST /handover` accepts arbitrary `{ events, nightLogs, date }` (honors "input arrives as data"). Each request emits one structured log line: which hotel, which night, why.

**Files:**
- Create: `src/server.ts`

- [ ] **Step 1: Write `src/server.ts`**

```ts
// src/server.ts
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateHandover } from "./pipeline";
import type { EventsFile } from "./types";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const webDist = join(root, "web", "dist");

const app = Fastify({ logger: true });

function loadSample(): { events: EventsFile; nightLogs: string } {
  return {
    events: JSON.parse(readFileSync(join(root, "data/events.json"), "utf8")) as EventsFile,
    nightLogs: readFileSync(join(root, "data/night-logs.md"), "utf8"),
  };
}

async function handle(
  app: import("fastify").FastifyInstance,
  events: EventsFile,
  nightLogs: string | undefined,
  date: string | undefined,
) {
  const started = Date.now();
  const handover = await generateHandover({ events, nightLogs, date });
  app.log.info(
    {
      hotel_id: handover.hotel.id,
      target_date: handover.date,
      events_ingested: events.events.length + (nightLogs ? nightLogs.split(/\r?\n/).filter((l) => /^\s*-\s+/.test(l)).length : 0),
      items_by_severity: handover.counts,
      flags_raised: handover.counts.flags,
      duration_ms: Date.now() - started,
    },
    "handover_generated",
  );
  return handover;
}

app.get<{ Querystring: { date?: string } }>("/handover", async (req) => {
  const { events, nightLogs } = loadSample();
  return handle(app, events, nightLogs, req.query.date);
});

app.post<{ Body: { events: EventsFile; nightLogs?: string; date?: string } }>(
  "/handover",
  async (req, reply) => {
    if (!req.body?.events?.events) {
      return reply.code(400).send({ error: "body must include an events file: { events: {...} }" });
    }
    return handle(app, req.body.events, req.body.nightLogs, req.body.date);
  },
);

app.get("/health", async () => ({ ok: true }));

if (existsSync(webDist)) {
  await app.register(fastifyStatic, { root: webDist });
}

const port = Number(process.env.PORT ?? 8080);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Manual smoke test**

Run (terminal A): `npm run dev`
Run (terminal B): `curl -s "http://localhost:8080/handover?date=2026-05-30" | head -c 400`
Expected: JSON with `hotel`, `date`, `counts`, `groups`. The dev server log shows a `handover_generated` line with `hotel_id`, `target_date`, `items_by_severity`. (First call may pause while the model downloads.)

- [ ] **Step 3: Commit**

```bash
git add src/server.ts
git commit -m "feat: Fastify API with GET/POST /handover and structured logging"
```
