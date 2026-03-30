# Backend API Dockerfile
# When Coolify builds this, it uses apps/api as context
# This Dockerfile is designed to work when build context is the apps/api directory itself
FROM node:18-alpine AS base

# Install dependencies needed for build
RUN apk add --no-cache libc6-compat git
RUN npm install -g pnpm@9.0.0 turbo

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY prisma ./prisma

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm db:generate

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build the API
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.0.0

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma Client for production
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose the API port
EXPOSE 4000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
