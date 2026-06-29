import type { QuotationStatus } from "../../routes/schema";

export type SortBy =
  | "created_at"
  | "quotation_date"
  | "quotation_number";

export type SortOrder = "asc" | "desc";

export interface ListQuotationsParams {
  page?: number;
  pageSize?: number;

  status?: QuotationStatus;

  search?: string;

  dateFrom?: number;
  dateTo?: number;

  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

export interface FindQuotationOptions {
  includeDeleted?: boolean;
}