# MVP Tech Blueprint: Manpower Quotation Management System

## 1. Tech Stack

- **Runtime:** Cloudflare Workers
- **Web framework:** Hono v4
- **OpenAPI tooling:** `@hono/zod-openapi`
- **Docs UI:** `@scalar/hono-api-reference`
- **Database:** Cloudflare D1
- **Query builder:** Kysely with `kysely-d1`
- **Validation:** Zod v4
- **PDF proxy:** native `fetch`

## 2. Architecture

- `src/create-app.ts` wires dependencies and mounts the API docs.
- `src/routes/` contains the HTTP layer and route-local schemas.
- `src/infra/services/` contains business rules and orchestration.
- `src/infra/repository/` contains database access and mapping helpers.
- `src/infra/db/` contains the Kysely schema and D1 migrations.

## 3. Data Model

- **quotations**
  - Stores the quotation header, customer info, timestamps, status, and soft-delete fields.
- **quotation_items**
  - Stores one or more items per quotation.
- **approval_steps**
  - Stores approval metadata, decision state, comments, and timestamps.

## 4. Current Route Layout

- `POST /api/drafts`
- `PUT /api/drafts/{id}`
- `POST /api/approvals/submit`
- `POST /api/approvals/{id}/approve`
- `POST /api/approvals/{id}/reject`
- `POST /api/approvals/send-to-client`
- `GET /api/quotations/{id}`
- `GET /api/quotations`
- `DELETE /api/quotations/{id}`
- `GET /api/dashboard/metrics`
- `POST /api/quotations/{id}/pdf/generate`
- `GET /api/quotations/{id}/pdf/download`

## 5. Documentation Endpoints

- OpenAPI JSON: `/api/doc`
- Scalar UI: `/api/scalar`
- LLM-friendly markdown: `/api/llms.txt`

## 6. Data and Workflow Notes

- Draft updates are limited to `DRAFT` and `REJECTED` records.
- Approval submission and approval decisions are applied in transactions.
- Soft-deleted rows remain in D1 but are filtered out of normal list and dashboard queries.
- PDF endpoints proxy the quotation payload to `PDF_SERVICE_URL` and return the upstream response.

## 7. Configuration Notes

- `DB` is the D1 binding used by the Worker.
- `PDF_SERVICE_URL` is required for PDF proxy endpoints.
- `wrangler.jsonc` uses `nodejs_compat` and a D1 migrations directory at `src/infra/db/migrations`.

## 8. Conventions

- Quotation number format is `QT-YYYY-0001` style in the current implementation.
- API contracts are derived from the Zod schemas in `src/routes/schema.ts`.
- Database writes belong in the repository layer only.
