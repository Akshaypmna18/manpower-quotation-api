# Manpower Quotation API

Cloudflare Worker backend for managing manpower quotations, built with Hono, Zod OpenAPI, D1, and Kysely.

## What It Does

- Create and update quotation drafts
- Submit quotations for approval
- Approve, reject, and send quotations to clients
- List, filter, sort, and soft-delete quotations
- Serve dashboard metrics
- Proxy quotation payloads to an external PDF service

## Architecture

The codebase follows a strict layer split:

- `src/routes/`: HTTP handlers, validation, and response formatting
- `src/infrastructure/services/`: business logic and orchestration
- `src/infrastructure/repository/`: persistence logic using Kysely builders
- `src/infrastructure/db/`: shared Kysely schema, client, and SQL migrations
- `src/routes/*.schema.ts`: route-local Zod request/response schemas
- `src/schemas/`: shared validation primitives and re-exports

## Database

- Schema source of truth for Kysely: `src/infrastructure/db/schema.ts`
- Raw SQL migrations: `src/infrastructure/db/migrations/*.sql`

## API Docs

- OpenAPI JSON: `/doc`
- Scalar UI: `/docs`

## Environment Variables

- `DB`: Cloudflare D1 binding
- `PDF_SERVICE_URL`: External PDF service endpoint

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Deploy:

```bash
npm run deploy
```

Generate Worker types:

```bash
npm run cf-typegen
```

Apply D1 migrations locally:

```bash
npm run db:migrate:local
```

Apply D1 migrations remotely:

```bash
npm run db:migrate:remote
```

List D1 migrations:

```bash
npm run db:migrate:list
```

## Notes

- Authentication is not implemented.
- The API contract is generated from the Zod schemas in `src/routes/*.schema.ts` and `src/schemas/common.ts`.
- Repository methods should remain the only place where persistence logic lives.
