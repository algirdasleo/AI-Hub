# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN echo "[BUILD] Installing dependencies stage..." && apk add --no-cache libc6-compat

RUN echo "[BUILD] Copying package files..."
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN echo "[BUILD] Running npm ci..." && npm ci --workspaces --include-workspace-root && echo "[BUILD] Dependencies installed successfully"

# Stage 2: Build client
FROM node:20-alpine AS builder
WORKDIR /app

RUN echo "[BUILD] Starting client builder stage..."
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

COPY . .

WORKDIR /app/client
ENV PATH="/app/client/node_modules/.bin:/app/node_modules/.bin:${PATH}"
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_TURBOPACK=0
RUN echo "[BUILD] Building Next.js client..." && npm run build && echo "[BUILD] Client build completed successfully"

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app/client
ENV NODE_ENV=production
ENV PATH="/app/client/node_modules/.bin:/app/node_modules/.bin:${PATH}"

RUN echo "[RUNTIME] Preparing runtime environment..." && adduser -D -s /bin/sh nextjs

RUN echo "[RUNTIME] Copying build artifacts..."
COPY --from=builder /app/client/.next ./.next
COPY --from=builder /app/client/public ./public
COPY --from=builder /app/client/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.base.json ../tsconfig.base.json
COPY --from=builder /app/shared ../shared

USER nextjs
EXPOSE 3000
ENV HOSTNAME=0.0.0.0

RUN echo "[RUNTIME] Client runtime ready on port 3000"
CMD ["next", "start", "-p", "3000"]