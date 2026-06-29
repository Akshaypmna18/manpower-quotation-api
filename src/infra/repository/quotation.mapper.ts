import type {
  ApprovalStepRow,
  QuotationItemRow,
  QuotationRow,
} from "../db/schema";

import type {
  ApprovalStep,
  Customer,
  Quotation,
  QuotationItem,
  QuotationListItem,
} from "../../routes/schema";

export function toCustomer(row: QuotationRow): Customer {
  return {
    name: row.customer_name,
    address: row.customer_address,
    phone: row.customer_phone,
    email: row.customer_email,
  };
}

export function toQuotationItem(row: QuotationItemRow): QuotationItem {
  return {
    id: row.id,
    category: row.category,
    quantity: row.quantity,
    rate: row.rate,
    otRate: row.ot_rate,
  };
}

export function toApprovalStep(row: ApprovalStepRow): ApprovalStep {
  return {
    id: row.id,
    quotationId: row.quotation_id,

    approverName: row.approver_name,
    approverId: row.approver_id,
    approverEmail: row.approver_email,

    decision: row.decision as ApprovalStep["decision"],

    comment: row.comment,

    requestedAt: row.requested_at ?? new Date().toISOString(),

    approvedAt: row.approved_at,
  };
}

export function toQuotation(
  row: QuotationRow,
  items: QuotationItem[],
): Quotation {
  return {
    id: row.id,

    quotationNumber: row.quotation_number,

    quotationDate: row.quotation_date,

    status: row.status as Quotation["status"],

    customer: toCustomer(row),

    items,

    isDeleted: Boolean(row.is_deleted),

    deletedAt: row.deleted_at,

    deletedBy: row.deleted_by,

    createdAt: row.created_at,

    updatedAt: row.updated_at,

    createdBy: row.created_by,

    updatedBy: row.updated_by,

    statusChangedAt: row.status_changed_at,
  };
}

export function toQuotationListItem(row: QuotationRow): QuotationListItem {
  return {
    id: row.id,

    quotationNumber: row.quotation_number,

    quotationDate: row.quotation_date,

    status: row.status as QuotationListItem["status"],

    customerName: row.customer_name,

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}
