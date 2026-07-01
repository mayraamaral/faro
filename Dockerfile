# syntax=docker/dockerfile:1.7
#
# Multi-stage Dockerfile for the Faro Expo app.
#
# Targets:
#   * deps        — installs all (dev + prod) dependencies; shared cache layer.
#   * dev         — runs `expo start --web` on port 8081 (hot reload).
#   * prod-build  — produces the static web bundle in /app/dist (CI use).
#   * prod        — nginx:alpine serving the static web bundle on port 80.
#
# Build examples:
#   docker build --target dev   -t faro:dev   .
#   docker build --target prod  -t faro:web   .
#

ARG NODE_VERSION=24-bookworm-slim

# -----------------------------------------------------------------------------
# 1. base — Node + pnpm (via corepack) + system deps for sharp / native builds.
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NODE_ENV=development \
    CI=true

# pnpm via corepack (pinned to the version in the project so dev/CI are aligned).
RUN corepack enable \
 && corepack prepare pnpm@10.29.2 --activate \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
        git \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# -----------------------------------------------------------------------------
# 2. deps — install ALL dependencies (dev included) with a cached pnpm store.
#    Reused by both `dev` and `prod-build` to keep rebuilds fast.
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy only the manifest files first to leverage Docker layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# `--frozen-lockfile` is mandatory: keeps the lockfile authoritative in CI/dev.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# 3. dev — Expo dev server with hot reload (port 8081).
#    Intended for local use: mount the source as a bind mount to keep edits
#    live without rebuilding the image.
# -----------------------------------------------------------------------------
FROM deps AS dev

ENV NODE_ENV=development \
    EXPO_DEV_SERVER_HOST=0.0.0.0 \
    EXPO_NO_TYPESCRIPT_SETUP=1

EXPOSE 8081 19000 19001 19002

# Default command: start the Metro dev server bound to all interfaces so
# `docker run -p 8081:8081` exposes the web bundle to the host.
# The container must be run with the source mounted, e.g.:
#   docker run --rm -p 8081:8081 -v "$PWD":/app -v /app/node_modules faro:dev
CMD ["pnpm", "run", "start:web", "--", "--host", "0.0.0.0"]

# -----------------------------------------------------------------------------
# 4. prod-build — build the static web bundle (used by the `prod` stage and CI).
#    Requires build-time env vars for Supabase (EXPO_PUBLIC_* are inlined at
#    bundle time by Metro's babel-preset-expo).
# -----------------------------------------------------------------------------
FROM deps AS prod-build

ARG EXPO_PUBLIC_SUPABASE_URL=""
ARG EXPO_PUBLIC_SUPABASE_KEY=""
ARG EXPO_PUBLIC_SUPABASE_ANIMALS_BUCKET="animals"

ENV EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL} \
    EXPO_PUBLIC_SUPABASE_KEY=${EXPO_PUBLIC_SUPABASE_KEY} \
    EXPO_PUBLIC_SUPABASE_ANIMALS_BUCKET=${EXPO_PUBLIC_SUPABASE_ANIMALS_BUCKET} \
    NODE_ENV=production

# Copy the rest of the source on top of the deps layer.
COPY . .

# `expo export --platform web` produces a fully static SPA in /app/dist.
# `--output-dir dist` is the default; explicit for clarity.
RUN pnpm exec expo export --platform web --output-dir dist

# -----------------------------------------------------------------------------
# 5. prod — nginx:alpine serving the static bundle.
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS prod

# SPA-tuned config: history-API fallback, immutable cache for hashed bundles.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=prod-build /app/dist /usr/share/nginx/html

EXPOSE 80
