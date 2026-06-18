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
# PORT is injected by Render at runtime; server reads process.env.PORT
ENV TRANSFORMERS_CACHE=/app/.cache
# Skip the ONNX zh→en model in the container: its ~25s cold start exceeds Render's
# 30s proxy timeout and the weights spike past the 512MB free-tier RAM (502/OOM).
# Translation stays available locally; baked here so it applies regardless of how
# the Render service was created (manual connect ignores render.yaml).
ENV SKIP_TRANSLATION=true
EXPOSE 8080
CMD ["npx", "tsx", "src/server.ts"]
