# Frontend Web Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all workspace packages
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Set build-time environment variables
# REPLACE THESE WITH YOUR ACTUAL URLs
ARG NEXT_PUBLIC_API_URL=https://your-backend-url.com
ARG NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# Build the web app
RUN pnpm turbo run build --filter=web

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/apps/web/next.config.js ./
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# REPLACE THESE WITH YOUR ACTUAL URLs
ENV NEXT_PUBLIC_API_URL=https://your-backend-url.com
ENV NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com

# Expose the web port
EXPOSE 3000

# Start the Next.js server
CMD ["node", "server.js"]
