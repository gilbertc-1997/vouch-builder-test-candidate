# Task 14: Containerize + Fly.io deploy

← [Task 13 — Web](task-13-web.md) · [Index](README.md) · Next: [Task 15 — Docs](task-15-docs.md)

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `fly.toml`

- [ ] **Step 1: Create `Dockerfile`**

```dockerfile
FROM node:20-slim
WORKDIR /app

# Backend deps
COPY package*.json ./
RUN npm ci

# Frontend deps + build
COPY web/package*.json ./web/
RUN npm --prefix web ci
COPY . .
RUN npm --prefix web run build

ENV NODE_ENV=production
ENV PORT=8080
# Cache the translation model inside the image directory at runtime
ENV TRANSFORMERS_CACHE=/app/.cache
EXPOSE 8080
CMD ["npx", "tsx", "src/server.ts"]
```

- [ ] **Step 2: Create `.dockerignore`**

```
node_modules
web/node_modules
web/dist
.git
*.log
```

- [ ] **Step 3: Create `fly.toml`** (adjust `app` to a unique name at deploy time)

```toml
app = "vouch-handover"
primary_region = "sin"

[build]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 1
```

- [ ] **Step 4: Deploy**

Run: `fly launch --no-deploy` (accept/adjust the generated app name; keep this `fly.toml`), then `fly deploy`
Expected: build succeeds; `fly deploy` reports a healthy machine. Note the assigned URL (e.g. `https://vouch-handover.fly.dev`).

- [ ] **Step 5: Verify the deployment**

Run: `curl -s "https://<your-app>.fly.dev/handover?date=2026-05-30" | head -c 400`
Expected: handover JSON. (First request may be slow while the model loads.)

- [ ] **Step 6: Commit**

```bash
git add Dockerfile .dockerignore fly.toml
git commit -m "chore: containerize and configure Fly.io deploy"
```
