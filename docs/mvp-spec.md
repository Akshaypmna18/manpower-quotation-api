# MVP Specification: Manpower Quotation Management System

## 1. Core Idea

- **What it does:** A REST API for managing the lifecycle of manpower quotations, including draft creation, approval handling, soft deletion, dashboard metrics, listing/filtering, and PDF proxying.
- **Who it is for:** Operations, sales, and management teams who prepare and approve manpower quotations.
- **Problem it solves:** Standardizes quotation data, keeps approval state transitions controlled, and exposes a clean API contract for downstream consumers.
- **Distinctiveness:** API-first design with `@hono/zod-openapi`, generated OpenAPI docs, and deployment on Cloudflare Workers with D1 storage.

## 2. Current API Surface

- `POST /api/drafts` creates a quotation in `DRAFT` status.
- `PUT /api/drafts/{id}` updates a quotation only when it is `DRAFT` or `REJECTED`.
- `POST /api/approvals/submit` moves a quotation to `PENDING_APPROVAL` and creates an approval step.
- `POST /api/approvals/{id}/approve` marks the pending approval step as approved and moves the quotation to `APPROVED`.
- `POST /api/approvals/{id}/reject` marks the pending approval step as rejected and moves the quotation to `REJECTED`.
- `POST /api/approvals/send-to-client` moves an approved quotation to `SENT`.
- `GET /api/quotations/{id}` returns a full quotation payload.
- `GET /api/quotations` returns a paginated, filterable list.
- `DELETE /api/quotations/{id}` soft-deletes a quotation.
- `GET /api/dashboard/metrics` returns status counts and recent quotations.
- `POST /api/quotations/{id}/pdf/generate` proxies a quotation payload to the external PDF service.
- `GET /api/quotations/{id}/pdf/download` proxies a quotation payload to the external PDF service.

## 3. Lifecycle Rules

- Drafts can be created freely.
- Drafts and rejected quotations can be edited.
- Submitted quotations must be in `PENDING_APPROVAL` before approval or rejection.
- Only approved quotations can be sent to a client.
- Soft-deleted quotations are excluded from normal list and dashboard queries.
- Approval and status updates are applied together to avoid half-updated records.

## 4. Scope

- **In Scope**
  - Quotation draft CRUD
  - Single-step approval workflow
  - Soft delete
  - Pagination, sorting, status/date filtering, and search
  - Dashboard metrics
  - External PDF proxying
  - OpenAPI docs and Scalar UI
- **Out of Scope**
  - Authentication and authorization
  - Background jobs
  - Email notifications
  - Native PDF generation

## 5. Success Criteria

- The API contract matches the current route set in `src/routes/`.
- Updates are blocked for quotations outside editable states.
- Approval transitions are consistent and auditable.
- Soft-deleted quotations stay in the database but disappear from normal responses.
- OpenAPI JSON and Scalar UI are available from the Worker.
