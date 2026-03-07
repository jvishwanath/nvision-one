FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS=--use-openssl-ca

COPY package*.json ./
RUN npm config set strict-ssl false \
  && NODE_TLS_REJECT_UNAUTHORIZED=0 npm ci \
  && npm config set strict-ssl true

COPY . .
RUN npm run db:generate \
  && npm run db:generate:pg
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/server/db/migrations ./src/server/db/migrations
COPY --from=builder /app/src/server/db/migrations-pg ./src/server/db/migrations-pg
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/data
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]
