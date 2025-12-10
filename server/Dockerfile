FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN echo "[BUILD] Installing build dependencies..." && apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
RUN echo "[BUILD] Copying package files..."
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/ ./shared/
COPY tsconfig.base.json ./

# Install all dependencies (including dev for build)
RUN echo "[BUILD] Running npm ci..." && npm ci && npm cache clean --force && echo "[BUILD] Dependencies installed successfully"

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN echo "[BUILD] Starting server builder stage..."
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the server
RUN echo "[BUILD] Building server..." && npm run build --workspace=server && echo "[BUILD] Server build completed successfully"

# Production image, copy all the files and run the server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Create a non-root user
RUN echo "[RUNTIME] Setting up runtime user..." && addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
RUN echo "[RUNTIME] Copying build artifacts..."
COPY --from=builder --chown=nextjs:nodejs /app/server/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/server/package*.json ./

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3001

# Start the server
RUN echo "[RUNTIME] Server runtime ready on port 3001"
CMD ["node", "dist/app.js"]