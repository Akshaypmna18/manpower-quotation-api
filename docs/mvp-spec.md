# MVP Specification: Manpower Quotation Management System

## 1. Core Idea
- **What it does:** A backend REST API to manage the lifecycle of manpower quotations, including draft creation, status transitions, single-approver workflow, soft deletion, audit history, and dashboard analytics. It also acts as a proxy to an external PDF generation service.
- **Who it is for:** Operations, sales, and management staff who prepare and approve manpower costings.
- **Problem it solves:** Standardizes quotation generation, tracks approval workflows, enforces editing constraints based on status, and serves as the data layer for manpower quotes.
- **Distinctiveness:** Follows an **API-first development** model exposing a `@hono/zod-openapi` schema interface with Swagger/Scalar docs. It runs on Cloudflare Workers edge runtime with local D1 database storage.

## 2. Core User Flows
- **Flow 1: Draft Management (API-First)**
  * Trigger: Staff creates or updates a quotation draft.
  * Steps: `POST /api/draft` -> Validate and save -> Return auto-generated unique `quotationNumber`. Update `DRAFT` or `REJECTED` quotes via `PUT /api/draft/:id`.
  * Outcome: Quotations are persistent, and read-only constraints are enforced for non-draft statuses.
- **Flow 2: Single-Approver Workflow**
  * Trigger: Staff submits a quotation for approval.
  * Steps: Submit via `POST /api/submit-approval` -> Status changes to `PENDING_APPROVAL`. Approver calls `POST /api/quotations/:id/approve` or `POST /api/quotations/:id/reject` to record their decision.
  * Outcome: Quotation moves to `APPROVED` or `REJECTED`, logging audit metadata.
- **Flow 3: Send to Client**
  * Trigger: Sales manager sends an approved quotation to a client.
  * Steps: `POST /api/send-to-client` -> Transition status to `SENT`.
  * Outcome: Quotation status updated to `SENT`.
- **Flow 4: Search, Filter, and Soft Delete**
  * Trigger: Staff views dashboard metrics or searches quotations.
  * Steps: Query dashboard API for status metrics. Query list API with pagination, status/date filters, and keyword searches. Delete a quote via `DELETE /api/quotations/:id`.
  * Outcome: Soft-deleted items are marked `isDeleted: true` and excluded from normal lists.
- **Flow 5: PDF Proxying**
  * Trigger: Staff requests quotation PDF generation or download.
  * Steps: `POST /api/quotations/:id/pdf/generate` or `GET /api/quotations/:id/pdf/download` -> Fetch quotation details -> Forward payload to external PDF service -> Return response.
  * Outcome: PDF data (URL or base64/binary string) is returned directly from the external service.

## 3. Scope
- **In Scope:**
  * Strict API-first contract generation with Zod-OpenAPI and Swagger/Scalar integration.
  * Initial endpoints: `POST /draft`, `PUT /draft/:id`, `POST /submit-approval`, `POST /send-to-client`.
  * Remaining CRUD, dashboard, list, PDF generation, PDF downloading, approval, and deletion endpoints following the same pattern.
  * Soft delete capability and status-based edit blocks.
- **Out of Scope (Explicitly Deferred):**
  * User Authentication and Authorization.
  * Real PDF binary creation logic (externalized).
  * Background jobs or cron jobs.
  * Email notifications to approvers/clients.

## 4. Success Criteria
- Deployment to Cloudflare Workers with D1 binding.
- OpenAPI schema successfully generated and exposed via Swagger/Scalar UI.
- Block updates to quotations in `PENDING_APPROVAL`, `APPROVED`, or `SENT` states.
- List queries successfully filter out soft-deleted quotations.
- PDF proxying endpoints forward payloads to the external service and return the response.
