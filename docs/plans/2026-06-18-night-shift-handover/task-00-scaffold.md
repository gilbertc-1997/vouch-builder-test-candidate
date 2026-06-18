# Task 0: Project scaffold

← [Index](README.md) · Next: [Task 1 — Shared types](task-01-types.md)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/.gitkeep`
- Verify: `.gitignore` (already exists)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "vouch-handover",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts",
    "build": "npm --prefix web ci && npm --prefix web run build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fastify/static": "^7.0.4",
    "@xenova/transformers": "^2.17.2",
    "fastify": "^4.28.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3",
    "vitest": "^2.0.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`** (typecheck only; backend runs via `tsx`, so no emit and no `.js` import extensions needed)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 4: Install and verify tooling**

Run: `npm install && npx vitest run`
Expected: install succeeds; vitest reports "No test files found" (exit 0 or "no tests" — acceptable at this stage).

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts package-lock.json
git commit -m "chore: scaffold TypeScript + Fastify + Vitest project"
```
