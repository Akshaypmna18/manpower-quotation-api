import type {
    ApprovalStepRow,
    NewApprovalStepRow,
    NewQuotationItemRow,
    NewQuotationRow,
    QuotationItemRow,
    QuotationRow,
    UpdateQuotationRow,
  } from "../infra/db/schema";
  import type {
    CreateQuotationInput,
    Quotation,
    QuotationItem,
    UpdateQuotationInput,
  } from "./schema";
  
  export function mapCreateQuotationInputToRow(
    input: CreateQuotationInput,
    quotationNumber: string,
  ): NewQuotationRow {
    const now = new Date().toISOString();
  
    return {
      id: crypto.randomUUID(),
      quotation_number: quotationNumber,
      quotation_date: input.quotationDate ?? Date.now(),
      status: "DRAFT",
  
      customer_name: input.customer.name,
      customer_address: input.customer.address,
      customer_phone: input.customer.phone,
      customer_email: input.customer.email,
  
      created_at: now,
      updated_at: now,
  
      created_by: input.createdBy,
      updated_by: input.createdBy,
  
      status_changed_at: now,
  
      is_deleted: 0,
      deleted_at: null,
      deleted_by: null,
    };
  }
  
  export function mapCreateQuotationItemsToRows(
    quotationId: string,
    items: CreateQuotationInput["items"],
  ): NewQuotationItemRow[] {
    return items.map((item) => ({
      id: crypto.randomUUID(),
      quotation_id: quotationId,
      category: item.category,
      quantity: item.quantity,
      rate: item.rate,
      ot_rate: item.otRate,
    }));
  }
  
  export function mapUpdateQuotationInputToRow(
    input: UpdateQuotationInput,
  ): UpdateQuotationRow {
    return {
      quotation_date: input.quotationDate,
      status: input.status,
  
      customer_name: input.customer?.name,
      customer_address: input.customer?.address,
      customer_phone: input.customer?.phone,
      customer_email: input.customer?.email,
  
      updated_at: new Date().toISOString(),
      updated_by: input.updatedBy,
  
      ...(input.status && {
        status_changed_at: new Date().toISOString(),
      }),
    };
  }
  
  export function mapQuotationItem(
    row: QuotationItemRow,
  ): QuotationItem {
    return {
      id: row.id,
      category: row.category,
      quantity: row.quantity,
      rate: row.rate,
      otRate: row.ot_rate,
    };
  }
  
  export function mapQuotation(
    quotation: QuotationRow,
    items: QuotationItemRow[],
  ): Quotation {
    return {
      id: quotation.id,
      quotationNumber: quotation.quotation_number,
      quotationDate: quotation.quotation_date,
      status: quotation.status as Quotation["status"],
  
      customer: {
        name: quotation.customer_name,
        address: quotation.customer_address,
        phone: quotation.customer_phone,
        email: quotation.customer_email,
      },
  
      items: items.map(mapQuotationItem),
  
      isDeleted: Boolean(quotation.is_deleted),
  
      deletedAt: quotation.deleted_at,
      deletedBy: quotation.deleted_by,
  
      createdAt: quotation.created_at,
      updatedAt: quotation.updated_at,
  
      createdBy: quotation.created_by,
      updatedBy: quotation.updated_by,
  
      statusChangedAt: quotation.status_changed_at,
    };
  }
  
  export function mapApprovalStepToRow(
    quotationId: string,
    approver: {
      approverName: string;
      approverId: string;
      approverEmail: string;
    },
  ): NewApprovalStepRow {
    return {
      id: crypto.randomUUID(),
      quotation_id: quotationId,
  
      approver_name: approver.approverName,
      approver_id: approver.approverId,
      approver_email: approver.approverEmail,
  
      decision: "PENDING",
  
      comment: null,
      requested_at: new Date().toISOString(),
      approved_at: null,
    };
  }