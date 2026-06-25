# MVP Tech Blueprint: Manpower Quotation Management System

## 1. Tech Stack
- **Backend/API:** Hono v4 + `@hono/zod-openapi` — Schema-driven API routing & auto-documentation.
- **Documentation:** `@scalar/hono-api-reference` (or Swagger UI) — Exposes OpenAPI JSON schema.
- **Runtime:** Cloudflare Workers — Edge serverless environment.
- **Database:** Cloudflare D1 — Embedded SQL database (SQLite compatible).
- **Validation:** Zod v3 (via Zod-OpenAPI) — Strict schema definition for API contracts.
- **HttpClient:** native `fetch` — For proxying PDF service requests.

## 2. Data Model
- **`quotations`**
  * `id` (TEXT, PK, UUID)
  * `quotation_number` (TEXT, UNIQUE, NOT NULL) — Auto-generated formatted string
  * `quotation_date` (INTEGER, NOT NULL) — UNIX Epoch timestamp
  * `status` (TEXT, NOT NULL) — `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `REJECTED`
  * `customer_name` (TEXT, NOT NULL)
  * `customer_address` (TEXT, NOT NULL)
  * `customer_phone` (TEXT, NOT NULL)
  * `customer_email` (TEXT, NOT NULL)
  * `is_deleted` (INTEGER, DEFAULT 0) — Boolean flag: `0` (false), `1` (true)
  * `deleted_at` (TEXT) — ISO-8601 string
  * `deleted_by` (TEXT)
  * `created_at` (TEXT, NOT NULL) — ISO-8601 string
  * `updated_at` (TEXT, NOT NULL) — ISO-8601 string
  * `created_by` (TEXT, NOT NULL)
  * `updated_by` (TEXT, NOT NULL)
  * `status_changed_at` (TEXT) — ISO-8601 string

- **`quotation_items`**
  * `id` (TEXT, PK, UUID)
  * `quotation_id` (TEXT, FK -> `quotations.id` ON DELETE CASCADE)
  * `category` (TEXT, NOT NULL)
  * `quantity` (TEXT, NOT NULL)
  * `rate` (TEXT, NOT NULL)
  * `ot_rate` (TEXT, NOT NULL)

- **`approval_steps`**
  * `id` (TEXT, PK, UUID)
  * `quotation_id` (TEXT, FK -> `quotations.id` ON DELETE CASCADE)
  * `approver_name` (TEXT, NOT NULL)
  * `approver_id` (TEXT, NOT NULL)
  * `approver_email` (TEXT, NOT NULL)
  * `decision` (TEXT, NOT NULL) — `PENDING`, `APPROVED`, `REJECTED`
  * `comment` (TEXT)
  * `requested_at` (TEXT) — ISO-8601 string
  * `approved_at` (TEXT) — ISO-8601 string

## 3. API Surface (OpenAPI endpoints)
- `POST /api/draft` — Create quotation in `DRAFT` status.
- `PUT /api/draft/:id` — Update quotation details/items (only allowed if status is `DRAFT` or `REJECTED`).
- `POST /api/submit-approval` — Submit a draft quotation for approval (status -> `PENDING_APPROVAL`).
- `POST /api/send-to-client` — Record that quote has been sent to client (status -> `SENT`).
- `GET /api/quotations/:id` — Retrieve full quotation by ID.
- `GET /api/quotations` — List quotations (pagination, search, filter; excludes soft-deleted).
- `DELETE /api/quotations/:id` — Soft-delete a quotation.
- `POST /api/quotations/:id/approve` — Approve quotation (status -> `APPROVED`).
- `POST /api/quotations/:id/reject` — Reject quotation (status -> `REJECTED`).
- `GET /api/dashboard/metrics` — Aggregate stats for statuses, counts, and recent entries.
- `POST /api/quotations/:id/pdf/generate` — Proxy to external PDF service, return string response.
- `GET /api/quotations/:id/pdf/download` — Proxy to external PDF service, return string response.

## 4. Folder Structure
```
src/
├── index.ts              # Entrypoint: registers Hono OpenAPI/Swagger app and routes
├── schemas/              # Reusable Zod OpenAPI schemas (single source of truth)
│   ├── quotation.ts      # Quotation, customer, and item schemas
│   ├── approval.ts       # Approver and decision schemas
│   └── dashboard.ts      # Metrics response schemas
├── routes/               # Tier 1: OpenAPI route definitions using @hono/zod-openapi
│   ├── draft.ts          # Handles /draft & /draft/:id
│   ├── approval.ts       # Handles approval steps & send-to-client
│   ├── quotation.ts      # Handles remaining CRUD & listing
│   └── dashboard.ts      # Handles metrics API
├── services/             # Tier 2: Core calculation rules & business logic
│   ├── quotation-service.ts
│   └── pdf-service.ts
├── repository/           # Tier 3: SQL queries on D1 database
│   └── quotation-repo.ts
├── db/
│   └── schema.sql        # SQLite migration schema
```

## 5. Conventions
- **API First:** Reusable Zod schemas under `src/schemas/` define the API contracts. Every endpoint has strict request schema, response schema, validation, OpenAPI metadata, and example responses.
- **Identifiers:** Quotation number format `QT-YYYYMMDD-[4-digit-seq]` is generated sequentially or via uuid sub-suffix.
- **Error Codes:** Return standard JSON responses `{ success: false, error: string }`. Hono Zod-OpenAPI naturally handles validation errors (`400`), status-based transition constraint violations (`403`), and missing resources (`404`).
- **Bindings:** D1 database is accessed via `c.env.DB` binding context.
