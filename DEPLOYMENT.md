# Atomix V1 Deployment Notes

## Current V1 shape

Atomix now models projects as long-lived Security Project Records (`SPR`) and reviews/pentests as dated Security Records (`SR`):

- `Project` = SPR / application portfolio record.
- `SecurityReview` = SR / dated pentest or security review.
- `ReviewWorkstream` = frontend, backend, API, MSB, LLM, or similar review stream.
- `ScopeProfile` = app risk/scoping profile.
- `Component` = sub-project, app component, API, service, frontend, backend, or LLM surface.
- `ReviewerProfile` + `ReviewerAssignment` = pentester capacity and active assignments.
- `ReviewExtension` / `ReviewCancellation` = manager-visible workflow exceptions.

## Recommended live architecture

```mermaid
flowchart LR
  Browser["User Browser"] --> Vercel["Next.js on Vercel"]
  Vercel --> Neon["Neon Postgres"]
  Vercel --> OllamaEndpoint["OLLAMA_BASE_URL"]
  OllamaEndpoint --> Ollama["Ollama / model host"]
```

## Database

The app is now configured for Neon/Postgres through `DATABASE_URL`.

For production V1, use Neon Postgres:

1. Create a Neon project/database.
2. Set `DATABASE_URL` in Vercel.
3. Set the same `DATABASE_URL` locally for one-time schema/data migration.
4. Run `npm run db:push` once to create the schema in Neon.
5. Run `npm run export:sqlite` to export local SQLite data.
6. Run `npm run import:postgres` with `DATABASE_URL` pointing at Neon.

Do not use a laptop-hosted database for production. If the laptop sleeps, the live app fails.

Important: the historical `prisma/migrations` in this repo were created while the app used SQLite. For the first Neon cutover, use `npm run db:push`, not `prisma migrate deploy`. After Neon is the source of truth, create a clean Postgres migration baseline before relying on `migrate deploy`.

Example local cutover:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/atomix?sslmode=require"
npm run db:push
npm run export:sqlite
npm run import:postgres
```

## LLM

Ollama is now environment-driven:

- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_API_KEY`

Safe V1 options:

1. Use a hosted LLM API later.
2. Run Ollama on a small always-on VPS.
3. Temporarily expose your machine with Cloudflare Tunnel or Tailscale Funnel.

If using your machine for Ollama, keep the DB on Neon. The app should remain usable when the LLM endpoint is offline.

### Local machine as AI server

Run Ollama locally:

```bash
ollama serve
ollama pull qwen3:8b
```

Run the Atomix AI proxy:

```bash
export OLLAMA_API_KEY="use-a-long-random-token"
npm run ai:server
```

Expose the proxy with a secure HTTPS tunnel, then put the tunnel URL in Vercel as `OLLAMA_BASE_URL`.

Example tunnel target:

```bash
cloudflared tunnel --url http://localhost:8787
```

Set these in Vercel:

```bash
OLLAMA_BASE_URL="https://your-tunnel.trycloudflare.com"
OLLAMA_MODEL="qwen3:8b"
OLLAMA_API_KEY="same-token-used-locally"
```

Do not expose raw Ollama directly without an auth layer. The included `npm run ai:server` proxy adds a bearer-token check.

## Vercel environment variables

Set these before deploying:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/atomix?sslmode=require"
NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
NEXTAUTH_SECRET="long-random-secret"
OLLAMA_BASE_URL="https://your-ai-tunnel.example.com"
OLLAMA_MODEL="qwen3:8b"
OLLAMA_API_KEY="long-random-token"
```

## Local UI review

After migrations:

```bash
npm run backfill:spr-sr
npm run dev
```

Review these pages:

- `/projects` for SPR portfolio.
- `/projects/[id]` for SPR detail, SR history, scope, components, and finding versions.
- `/reviews` for pentest manager SR command center.
- `/reviewers` for pentester availability and assignments.

## Known production hardening items

- Add organization/tenant scoping before multi-tenant launch.
- Replace string workflow states with controlled constants or enums once flows stabilize.
- Add background jobs for AI analysis rather than long-running Vercel requests.
- Add audit logs for assignment, extension, cancellation, exception, and remediation actions.
- Add RBAC checks per route/action, not only sidebar visibility.
