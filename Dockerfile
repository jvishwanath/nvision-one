FROM node:20-bookworm-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

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
RUN echo "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" > .env.production \
  && echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" >> .env.production
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.env.production ./.env.production
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/server/db/migrations ./src/server/db/migrations
COPY --from=builder /app/src/server/db/migrations-pg ./src/server/db/migrations-pg
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/data
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]
