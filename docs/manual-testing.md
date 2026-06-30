# Manual Testing Checklist

Use this list after refactors to confirm the API still behaves as expected.

## Setup

- [ ] Start the Worker locally with `wrangler dev`
- [ ] Confirm the OpenAPI JSON loads at `/api/doc`
- [ ] Confirm the Scalar UI loads at `/api/scalar`
- [ ] Confirm `llms.txt` loads at `/api/llms.txt`

## Draft Flow

- [ ] `POST /api/drafts` creates a quotation in `DRAFT` status
- [ ] The response includes an auto-generated `quotationNumber`
- [ ] `PUT /api/drafts/{id}` updates a draft quotation successfully
- [ ] `PUT /api/drafts/{id}` returns `403` when the quotation is not editable
- [ ] `PUT /api/drafts/{id}` does not accept status changes from the client

## Approval Flow

- [ ] `POST /api/approvals/submit` moves a quotation to `PENDING_APPROVAL`
- [ ] `POST /api/approvals/{id}/approve` moves it to `APPROVED`
- [ ] `POST /api/approvals/{id}/reject` moves it to `REJECTED`
- [ ] Approval or rejection on the wrong status returns `403`
- [ ] Approval submission creates a pending approval step
- [ ] Approval and status changes stay in sync after the request completes

## Client Delivery

- [ ] `POST /api/approvals/send-to-client` moves an approved quotation to `SENT`
- [ ] Sending a non-approved quotation returns `403`

## Retrieval and List

- [ ] `GET /api/quotations/{id}` returns the full quotation payload
- [ ] `GET /api/quotations` supports pagination and returns the expected items
- [ ] Search, status, date, and sort parameters narrow the list as expected

## Soft Delete

- [ ] `DELETE /api/quotations/{id}` marks a quotation as deleted
- [ ] Soft-deleted quotations do not appear in the default list response
- [ ] The soft-deleted row still exists in D1 when inspected directly

## Dashboard

- [ ] `GET /api/dashboard/metrics` returns counts by status
- [ ] Dashboard recent items update after creating quotations

## PDF Proxy

- [ ] `POST /api/quotations/{id}/pdf/generate` forwards to the external PDF service
- [ ] `GET /api/quotations/{id}/pdf/download` forwards to the external PDF service
- [ ] PDF service failures surface as `502`

## Regression Notes

- [ ] No route file contains SQL
- [ ] No service file contains direct DB access
- [ ] Import paths still resolve after renames
