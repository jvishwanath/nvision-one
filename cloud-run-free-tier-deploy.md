# LifeOS Cloud Run Deployment (Free Tier Focus)

This guide is tuned for **Cloud Run free tier** usage and your current SQLite-first setup.

## SQLite-only status (current code)

The current server code is SQLite-only.

- `DB_DRIVER=sqlite` is required for runtime success.
- Postgres mode is not implemented yet and will fail fast.

---

## Quick path: SQLite-only deploy from Docker Hub

If you already have a pushed image (for example `docker.io/<username>/nvisionone:latest`), these are the minimum settings:

1. Cloud Run service image: `docker.io/<username>/nvisionone:latest`
2. Environment variables:
   - `DB_DRIVER=sqlite`
   - `DATABASE_URL=/app/data/lifeos.db`
   - `NEXT_PUBLIC_PERSISTENCE=server`
3. Secret env var:
   - `AUTH_SECRET` from Secret Manager
4. Storage mount:
   - Cloud Storage bucket mounted at `/app/data`
5. Free-tier limits:
   - `min-instances=0`
   - `max-instances=1`
   - `cpu=1`
   - `memory=512Mi`

The container entrypoint handles idempotent startup for SQLite:

- ensures DB directory/file exists
- runs migrations if migration journal exists

---

## 0) Free-tier strategy (important)

To stay near free tier:

- Use a free-tier-supported region (commonly `us-central1`, `us-east1`, or `us-west1`; verify current Google pricing page).
- Keep service idle when unused:
  - `--min-instances=0`
- Limit scale for SQLite safety and cost:
  - `--max-instances=1`
- Keep CPU/memory small:
  - `--cpu=1 --memory=512Mi`
- Avoid high background traffic and frequent polling from many clients.

> Note: Cloud Run can be free-tier, but other resources (Cloud Storage bucket for SQLite file, network egress) may still incur small charges.

---

## 1) One-time setup

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project <GCP_PROJECT_ID>
gcloud config set run/region us-central1
```

Enable required APIs:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

---

## 2) Secrets + SQLite storage

### 2.1 Create auth secret

```bash
echo -n "<LONG_RANDOM_AUTH_SECRET>" | gcloud secrets create lifeos-auth-secret --data-file=-
```

If it already exists:

```bash
echo -n "<LONG_RANDOM_AUTH_SECRET>" | gcloud secrets versions add lifeos-auth-secret --data-file=-
```

### 2.2 Create bucket for SQLite file (mounted path)

```bash
gsutil mb -l us-central1 gs://<YOUR_LIFEOS_DB_BUCKET>
```

---

## 3) Generate and commit migrations first

Your app runs startup migrations only when Drizzle journal exists.

```bash
npm install
npm run db:generate
```

Commit generated migration files under `src/server/db/migrations`.

---

## 4) Build container image

### 4.1 Docker Hub auth (Mac)

Install/start Docker Desktop on Mac, then authenticate to Docker Hub:

```bash
docker login
```

Use your Docker Hub username + password/token when prompted.

If you prefer token-based login:

```bash
echo "<DOCKERHUB_ACCESS_TOKEN>" | docker login -u <DOCKERHUB_USERNAME> --password-stdin
```

### 4.2 Choose one build path

You can build either with Cloud Build or locally on your Mac.

Set your Docker Hub username first:

```bash
export DOCKERHUB_USERNAME=<YOUR_DOCKERHUB_USERNAME>
```

#### Option A: Build with Cloud Build (runs in GCP)

```bash
gcloud builds submit \
  --tag docker.io/$DOCKERHUB_USERNAME/lifeos:latest
```

#### Option B: Build locally on Mac and push to Docker Hub

```bash
docker build -t docker.io/$DOCKERHUB_USERNAME/lifeos:latest .
docker push docker.io/$DOCKERHUB_USERNAME/lifeos:latest
```

If your Mac is Apple Silicon and you want explicit Cloud Run-compatible linux/amd64 image:

```bash
docker buildx build \
  --platform linux/amd64 \
  -t docker.io/$DOCKERHUB_USERNAME/lifeos:latest \
  --push .
```

---

## 5) Deploy to Cloud Run (free-tier oriented)

```bash
gcloud run deploy lifeos \
  --image docker.io/$DOCKERHUB_USERNAME/lifeos:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --concurrency 10 \
  --cpu 1 \
  --memory 512Mi \
  --set-env-vars DB_DRIVER=sqlite,NEXT_PUBLIC_PERSISTENCE=server,DATABASE_URL=/app/data/lifeos.db \
  --set-secrets AUTH_SECRET=lifeos-auth-secret:latest \
  --add-volume name=lifeos-db,type=cloud-storage,bucket=<YOUR_LIFEOS_DB_BUCKET> \
  --add-volume-mount volume=lifeos-db,mount-path=/app/data
```

### Why these flags

- `min-instances=0`: scale to zero when idle (best for free tier).
- `max-instances=1`: safer for SQLite single-writer model.
- `concurrency=10`: modest request parallelism while still single instance.

---

## 6) Verify

```bash
curl https://<CLOUD_RUN_URL>/api/health
```

Then open:

- `https://<CLOUD_RUN_URL>/register`
- create user and sign in

---

## 7) Update deployment (new versions)

After code changes:

```bash
gcloud builds submit \
  --tag docker.io/$DOCKERHUB_USERNAME/lifeos:latest

gcloud run deploy lifeos \
  --image docker.io/$DOCKERHUB_USERNAME/lifeos:latest \
  --region us-central1
```

(Cloud Run retains previous env/secrets/volume settings unless overridden.)

---

## 8) Cost guardrails checklist

- [ ] `min-instances=0`
- [ ] `max-instances=1`
- [ ] Region in free-tier list
- [ ] Small memory/CPU (`512Mi`, `1 vCPU`)
- [ ] No unnecessary synthetic uptime pings
- [ ] Budget + alert configured in GCP Billing

### 8.1 Keep Docker Hub usage low-cost

Docker Hub has a free plan with limits. To stay in free-tier-like usage:

- Keep only one active tag (`latest`) for hobby deploys.
- Delete old image tags from Docker Hub periodically.
- Avoid large image layers and unnecessary rebuilds.
- Keep Cloud Run in same region to reduce egress surprises.

Create a budget alert (recommended):

- GCP Console → Billing → Budgets & alerts → Create budget
- Set very low threshold (e.g., $1, $5)

---

## 9) Troubleshooting

### Volume flags not recognized

Update gcloud SDK:

```bash
gcloud components update
```

### Unauthorized/session issues

- Confirm `AUTH_SECRET` exists and is set from Secret Manager.
- Confirm service URL uses HTTPS and no mixed-domain cookie confusion.

### SQLite lock or odd write behavior

- Keep `max-instances=1`.
- Avoid aggressive client-side auto-refresh from many users.

---

## 10) Current architecture note

For hobby/single-user scale, SQLite on Cloud Run with one instance is practical.
For larger multi-user production, consider migrating to a managed SQL backend.

---

## 11) Postgres (Supabase) implementation roadmap

This section is a code implementation plan, not a runtime toggle.

### 11.1 Why this is needed

Current code uses:

- SQLite driver/runtime (`better-sqlite3`)
- SQLite Drizzle dialect/schema (`drizzle-orm/sqlite-core`)
- SQLite migration runner

So setting `DB_DRIVER=postgres` today will fail.

### 11.2 Implementation tasks

1. Add Postgres driver support in server DB bootstrap (`pg` + Drizzle postgres runtime).
2. Add Postgres schema definitions (or migrate shared schema strategy) compatible with `pg-core`.
3. Add Postgres migration config + output folder and migration runner.
4. Extend `docker-entrypoint.sh`:
   - sqlite mode: keep current init + migrate behavior
   - postgres mode: run Postgres migrate only (no local file init)
5. Keep migrations idempotent for both drivers.
6. Validate all repositories/routes/auth flows against Postgres.

### 11.3 Cloud Run config after Postgres implementation

- `DB_DRIVER=postgres`
- `DATABASE_URL=postgresql://...?...sslmode=require`
- `AUTH_SECRET` from Secret Manager
- `NEXT_PUBLIC_PERSISTENCE=server`
- remove SQLite bucket mount (`/app/data`) for Postgres mode
