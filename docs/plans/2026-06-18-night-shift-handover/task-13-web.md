# Task 13: React view (`web/`)

← [Task 12 — Server](task-12-server.md) · [Index](README.md) · Next: [Task 14 — Deploy](task-14-deploy.md)

A deliberately plain Vite + React app: fetch the JSON, render the three buckets with source-ref tags and flag chips. No styling beyond legibility.

**Files:**
- Create: `web/package.json`, `web/vite.config.ts`, `web/index.html`, `web/src/main.tsx`, `web/src/api.ts`, `web/src/App.tsx`, `web/src/styles.css`

- [ ] **Step 1: Create `web/package.json`**

```json
{
  "name": "vouch-handover-web",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.3.4"
  }
}
```

- [ ] **Step 2: Create `web/vite.config.ts`** (dev proxy so the React dev server can call the API)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/handover": "http://localhost:8080", "/health": "http://localhost:8080" } },
  build: { outDir: "dist" },
});
```

- [ ] **Step 3: Create `web/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Night-Shift Handover</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `web/src/main.tsx`**

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Create `web/src/api.ts`** (mirror of the backend `Handover` shape)

```ts
export interface SourceRef { source: "json" | "log"; id: string; line?: number; }
export interface HandoverItem {
  threadId: string;
  severity: "act_now" | "pending" | "fyi";
  severityReason: string[];
  classification: "still_open" | "newly_resolved" | "new_tonight";
  summary: string;
  room: string | null;
  sourceRefs: SourceRef[];
  flags: string[];
}
export interface Handover {
  hotel: { id: string; name: string };
  date: string;
  generatedAt: string;
  counts: { act_now: number; pending: number; fyi: number; flags: number };
  groups: { act_now: HandoverItem[]; pending: HandoverItem[]; fyi: HandoverItem[] };
}

export async function fetchHandover(date?: string): Promise<Handover> {
  const res = await fetch(`/handover${date ? `?date=${date}` : ""}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 6: Create `web/src/App.tsx`**

```tsx
import { useEffect, useState } from "react";
import { fetchHandover, type Handover, type HandoverItem } from "./api";

const BUCKETS: Array<{ key: "act_now" | "pending" | "fyi"; label: string }> = [
  { key: "act_now", label: "🔥 Act now" },
  { key: "pending", label: "⏳ Pending" },
  { key: "fyi", label: "ℹ️ FYI" },
];

function Item({ item }: { item: HandoverItem }) {
  return (
    <li className={`item ${item.severity}`}>
      <div className="summary">{item.summary}</div>
      <div className="meta">
        <span className="tag">{item.classification}</span>
        {item.flags.map((f) => (
          <span key={f} className="flag">{f}</span>
        ))}
        {item.sourceRefs.map((r) => (
          <span key={r.id} className="ref">{r.id}</span>
        ))}
      </div>
      {item.severityReason.length > 0 && <div className="why">why: {item.severityReason.join("; ")}</div>}
    </li>
  );
}

export function App() {
  const [date, setDate] = useState("2026-05-30");
  const [data, setData] = useState<Handover | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    fetchHandover(date).then(setData).catch((e) => setError(String(e)));
  }, [date]);

  return (
    <main>
      <h1>Night-Shift Handover</h1>
      <label>
        Morning of{" "}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      {!data && !error && <p>Loading…</p>}
      {data && (
        <>
          <p className="hotel">
            {data.hotel.name} — {data.counts.act_now} urgent · {data.counts.pending} pending ·{" "}
            {data.counts.fyi} FYI · {data.counts.flags} flagged
          </p>
          {BUCKETS.map(({ key, label }) => (
            <section key={key}>
              <h2>{label} ({data.groups[key].length})</h2>
              <ul>
                {data.groups[key].map((i) => <Item key={i.threadId} item={i} />)}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 7: Create `web/src/styles.css`**

```css
:root { font-family: system-ui, sans-serif; line-height: 1.4; }
main { max-width: 760px; margin: 2rem auto; padding: 0 1rem; }
h1 { margin-bottom: 0.25rem; }
.hotel { color: #444; }
section { margin-top: 1.5rem; }
ul { list-style: none; padding: 0; }
.item { border-left: 4px solid #ccc; padding: 0.6rem 0.8rem; margin: 0.5rem 0; background: #fafafa; }
.item.act_now { border-color: #d33; }
.item.pending { border-color: #e6a700; }
.item.fyi { border-color: #888; }
.summary { font-weight: 600; }
.meta { margin-top: 0.3rem; display: flex; flex-wrap: wrap; gap: 0.3rem; }
.tag, .flag, .ref { font-size: 0.72rem; padding: 0.05rem 0.4rem; border-radius: 999px; }
.tag { background: #e7eefc; }
.flag { background: #fde2e1; }
.ref { background: #eee; font-family: ui-monospace, monospace; }
.why { font-size: 0.78rem; color: #666; margin-top: 0.25rem; }
.error { color: #d33; }
```

- [ ] **Step 8: Build the frontend and smoke-test end-to-end**

Run: `npm --prefix web install && npm --prefix web run build`
Expected: `web/dist/` is produced.
Run: `npm start` then `curl -s localhost:8080/ | head -c 200`
Expected: the built `index.html` is served (static hosting works alongside the API).

- [ ] **Step 9: Commit**

```bash
git add web
git commit -m "feat: plain React view over the handover JSON"
```
