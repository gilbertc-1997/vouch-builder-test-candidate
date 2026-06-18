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
EXPOSE 8080
CMD ["npx", "tsx", "src/server.ts"]
