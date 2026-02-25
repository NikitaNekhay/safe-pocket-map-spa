# ─────────────────────────────────────────────
# Stage 1 – build
# Build context must be the repo ROOT so that
# the monorepo local package ("file:..") resolves.
#
#   docker build -f frontend/Dockerfile -t spm-frontend .
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Root package.json is the monorepo package that
# frontend depends on via "safe-pocket-map-monorepo": "file:.."
COPY package.json ./

# Dependency manifests first (layer cache)
COPY frontend/package.json frontend/package-lock.json* ./frontend/

# Install – npm resolves "file:.." against /app
RUN npm install --prefix frontend --legacy-peer-deps

# Copy source
COPY frontend/ ./frontend/

# Build static assets
WORKDIR /app/frontend
ARG VITE_API_URL
ARG VITE_GA_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GA_ID=$VITE_GA_ID
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 – serve with nginx
# ─────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
