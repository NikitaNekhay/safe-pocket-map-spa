# ─────────────────────────────────────────────
# Safe Pocket Map – Backend
# Build context must be the repo ROOT so that
# the monorepo local package ("file:..") resolves.
#
#   docker build -f backend/Dockerfile -t spm-backend .
# ─────────────────────────────────────────────
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Root package.json is the monorepo package that
# backend depends on via "safe-pocket-map-monorepo": "file:.."
COPY package.json ./

# Dependency manifests first (layer cache)
COPY backend/package.json backend/package-lock.json* ./backend/

# Install production dependencies only
RUN npm install --prefix backend --omit=dev --legacy-peer-deps

# Copy source
COPY backend/ ./backend/

# Drop privileges
USER appuser

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# --openssl-legacy-provider is required by the project (googleapis compat)
CMD ["node", "--openssl-legacy-provider", "index.js"]
