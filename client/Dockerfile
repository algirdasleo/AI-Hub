# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN npm ci --workspaces --include-workspace-root

# Stage 2: Build client
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

COPY . .

WORKDIR /app/client
ENV PATH="/app/client/node_modules/.bin:/app/node_modules/.bin:${PATH}"
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_TURBOPACK=0
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app/client
ENV NODE_ENV=production
ENV PATH="/app/client/node_modules/.bin:/app/node_modules/.bin:${PATH}"

RUN adduser -D -s /bin/sh nextjs

COPY --from=builder /app/client/.next ./.next
COPY client/public ./public
COPY --from=builder /app/client/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.base.json ../tsconfig.base.json
COPY --from=builder /app/shared ../shared

USER nextjs
EXPOSE 3000
ENV HOSTNAME=0.0.0.0

CMD ["next", "start", "-p", "3000"]