# Multi-stage Dockerfile — Interview Prep API
# Build context: outputs/implementation/backend/

# ─── Stage 1: Install production dependencies ─────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --only=production --ignore-scripts

# ─── Stage 2: Build TypeScript ────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install --ignore-scripts
COPY lib/     ./lib/
COPY db/      ./db/
COPY modules/ ./modules/
COPY server.ts worker.ts ./
RUN npm run build

# ─── Stage 3: Production runner ───────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 fastify

# Copy only what's needed
COPY --from=deps    --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/dist        ./dist
COPY --chown=fastify:nodejs package.json ./

USER fastify
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
