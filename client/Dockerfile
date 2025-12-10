FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
COPY shared ./shared
COPY tsconfig.base.json ./

RUN npm ci --workspaces --include-workspace-root

COPY client ./client

WORKDIR /app/client

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]