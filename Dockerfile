# GridSync Dockerfile - Coolify Deployment
# Monolithic: API (Socket.io) + Web (Next.js) in single container

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache openssl

# Dependencies stage
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build API and Web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter api build
RUN pnpm --filter web build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV API_PORT=3001

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gridsync

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/node_modules ./node_modules

# API files
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Web files
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

# Packages
COPY --from=builder /app/packages ./packages

# Initialize database
RUN cd apps/api && npx prisma db push --skip-generate
RUN cd apps/api && node prisma/seed.cjs

# Permissions
RUN chown -R gridsync:nodejs /app
USER gridsync

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
