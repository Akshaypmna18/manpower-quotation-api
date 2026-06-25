# MVP Implementation Tasks

> Status: Planning complete. Work top to bottom. Check off tasks as they are done.

## Phase 1: Scaffold & Setup
- [ ] Task 1.1: Initialize a new Cloudflare Workers + Hono + TypeScript project using `npm create cloudflare@latest` (project folder contains wrangler.toml and package.json)
- [ ] Task 1.2: Install project dependencies including `@hono/zod-openapi` and `@scalar/hono-api-reference` (package.json contains dependencies)
- [ ] Task 1.3: Set up `.env.example` and initial `wrangler.toml` specifying the D1 Database binding named `DB` (example environment files exist)

## Phase 2: Database & API
- [ ] Task 2.1: Define database schema in `src/db/schema.sql` for `quotations`, `quotation_items`, and `approval_steps` (schema file exists and executes cleanly against D1 local)
- [ ] Task 2.2: Implement database migrations and verify D1 local database is initialized (local D1 instance runs and tables are created)
- [ ] Task 2.3: Create reusable Zod OpenAPI schemas in `src/schemas/` for Quotations, Customer, QuotationItem, and ApprovalSteps (Zod schemas export correctly)
- [ ] Task 2.4: Implement repository classes (`src/repository/`) for database interaction (repositories correctly execute SQL select, insert, update, and delete queries)
- [ ] Task 2.5: Create the API routes and handlers for core draft lifecycle: `POST /api/draft` and `PUT /api/draft/:id` (drafts can be created and modified with unique QT numbers)
- [ ] Task 2.6: Create the API routes for approval submission and client sending: `POST /api/submit-approval` and `POST /api/send-to-client` (status transitions are enforced)
- [ ] Task 2.7: Implement approval and rejection handlers: `POST /api/quotations/:id/approve` and `POST /api/quotations/:id/reject` (transitions update database status and logs)
- [ ] Task 2.8: Create retrieval and soft deletion handlers: `GET /api/quotations/:id` and `DELETE /api/quotations/:id` (fetching retrieves details, deleting soft-deletes)
- [ ] Task 2.9: Implement listing API `GET /api/quotations` with pagination, sorting, and filters for status/customer/date (returns list matching query parameters and excludes soft-deleted items)
- [ ] Task 2.10: Implement dashboard metrics handler `GET /api/dashboard/metrics` (returns aggregated counts by status and recent quotation entries)

## Phase 3: Integration & Documentation
- [ ] Task 3.1: Mount `@scalar/hono-api-reference` middleware on `/docs` and expose OpenAPI JSON specifications (Scalar UI renders correctly at `/docs`)
- [ ] Task 3.2: Create the external PDF service client in `src/services/pdf-service.ts` to proxy requests (service successfully forwards payloads to `PDF_SERVICE_URL`)
- [ ] Task 3.3: Expose `POST /api/quotations/:id/pdf/generate` and `GET /api/quotations/:id/pdf/download` proxy endpoints (endpoints return external PDF service response)

## Phase 4: Polish & Verify
- [ ] Task 4.1: Perform manual API smoke checks verifying quotation creation, update restrictions, and single-approver workflow (all transitions return correct status codes)
- [ ] Task 4.2: Perform manual verification of dashboard metrics and paginated lists (metrics reflect database state and search finds quotes by customer/number)
- [ ] Task 4.3: Perform manual verification of the soft delete behavior (deleted quotes do not appear in list results but remain in database)
