import type {
    ColumnType,
    Generated,
    Insertable,
    Selectable,
    Updateable,
  } from "kysely";
  
  export interface QuotationsTable {
    id: string;
    quotation_number: string;
    quotation_date: number;
    status: string;
  
    customer_name: string;
    customer_address: string;
    customer_phone: string;
    customer_email: string;
  
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
  
    status_changed_at: string | null;
  
    is_deleted: Generated<number>;
    deleted_at: ColumnType<
      string | null,
      string | null | undefined,
      string | null | undefined
    >;
    deleted_by: ColumnType<
      string | null,
      string | null | undefined,
      string | null | undefined
    >;
  }
  
  export interface QuotationItemsTable {
    id: string;
    quotation_id: string;
    category: string;
    quantity: string;
    rate: string;
    ot_rate: string;
  }
  
  export interface ApprovalStepsTable {
    id: string;
    quotation_id: string;
  
    approver_name: string;
    approver_id: string;
    approver_email: string;
  
    decision: string;
  
    comment: ColumnType<
      string | null,
      string | null | undefined,
      string | null | undefined
    >;
  
    requested_at: ColumnType<
      string | null,
      string | null | undefined,
      string | null | undefined
    >;
  
    approved_at: ColumnType<
      string | null,
      string | null | undefined,
      string | null | undefined
    >;
  }
  
  export interface DatabaseSchema {
    quotations: QuotationsTable;
    quotation_items: QuotationItemsTable;
    approval_steps: ApprovalStepsTable;
  }
  
  export type QuotationRow = Selectable<QuotationsTable>;
  export type NewQuotationRow = Insertable<QuotationsTable>;
  export type UpdateQuotationRow = Updateable<QuotationsTable>;
  
  export type QuotationItemRow = Selectable<QuotationItemsTable>;
  export type NewQuotationItemRow = Insertable<QuotationItemsTable>;
  export type UpdateQuotationItemRow = Updateable<QuotationItemsTable>;
  
  export type ApprovalStepRow = Selectable<ApprovalStepsTable>;
  export type NewApprovalStepRow = Insertable<ApprovalStepsTable>;
  export type UpdateApprovalStepRow = Updateable<ApprovalStepsTable>;