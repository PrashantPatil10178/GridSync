# Backend API Dockerfile
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
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN cd apps/api && pnpm db:generate

# Build the API
RUN pnpm turbo run build --filter=api

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# REPLACE THESE WITH YOUR ACTUAL URLs
ENV FRONTEND_URL=https://your-frontend-url.com
ENV BACKEND_URL=https://your-backend-url.com

# Database URL should be set at runtime or via secrets
# ENV DATABASE_URL=your-database-url

WORKDIR /app/apps/api

# Expose the API port
EXPOSE 4000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
