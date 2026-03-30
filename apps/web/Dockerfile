# Frontend Web Dockerfile
# When Coolify builds this, it uses apps/web as context
# This Dockerfile is designed to work when build context is the apps/web directory itself
FROM node:18-alpine AS base

# Install dependencies needed for build
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.0.0

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY next.config.js ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Copy source code
COPY app ./app
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public

# Build the Next.js app
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.0.0

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application (if using standalone output)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the web port
EXPOSE 3000

# Start the Next.js server
CMD ["node", "server.js"]
