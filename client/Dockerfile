# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN npm ci

# Stage 2: Build client
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

WORKDIR /app/client
ENV PATH="/app/node_modules/.bin:${PATH}"
RUN NEXT_TELEMETRY_DISABLED=1 NEXT_TURBOPACK=0 npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app/client
ENV NODE_ENV=production

RUN adduser -D -s /bin/sh nextjs

COPY --from=builder /app/client/.next ./.next
COPY --from=builder /app/client/public ./public
COPY --from=builder /app/client/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.base.json ../tsconfig.base.json
COPY --from=builder /app/shared ../shared

RUN npm prune --omit=dev

USER nextjs
EXPOSE 3000
ENV HOSTNAME=0.0.0.0

CMD ["next", "start", "-p", "3000"]