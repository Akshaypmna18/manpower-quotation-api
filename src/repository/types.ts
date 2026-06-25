import type { ApprovalDecision, QuotationStatus } from "../schemas/common";
import type { ApprovalStep } from "../schemas/approval";
import type {
	Customer,
	Quotation,
	QuotationItem,
	QuotationListItem,
} from "../schemas/quotation";

export interface QuotationRow {
	id: string;
	quotation_number: string;
	quotation_date: number;
	status: QuotationStatus;
	customer_name: string;
	customer_address: string;
	customer_phone: string;
	customer_email: string;
	is_deleted: number;
	deleted_at: string | null;
	deleted_by: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
	status_changed_at: string | null;
}

export interface QuotationItemRow {
	id: string;
	quotation_id: string;
	category: string;
	quantity: string;
	rate: string;
	ot_rate: string;
}

export interface ApprovalStepRow {
	id: string;
	quotation_id: string;
	approver_name: string;
	approver_id: string;
	approver_email: string;
	decision: ApprovalDecision;
	comment: string | null;
	requested_at: string | null;
	approved_at: string | null;
}

export interface CreateQuotationInput {
	id: string;
	quotationNumber: string;
	quotationDate: number;
	status: QuotationStatus;
	customer: Customer;
	items: Omit<QuotationItem, "id">[];
	createdBy: string;
	now: string;
}

export interface UpdateQuotationInput {
	quotationDate?: number;
	customer?: Customer;
	items?: QuotationItem[];
	updatedBy: string;
	now: string;
}

export interface ListQuotationsParams {
	page?: number;
	pageSize?: number;
	status?: QuotationStatus;
	search?: string;
	dateFrom?: number;
	dateTo?: number;
	sortBy?: "created_at" | "quotation_date" | "quotation_number";
	sortOrder?: "asc" | "desc";
}

export interface CreateApprovalStepInput {
	id: string;
	quotationId: string;
	approverName: string;
	approverId: string;
	approverEmail: string;
	requestedAt: string;
}

export function mapQuotationRow(
	row: QuotationRow,
	items: QuotationItemRow[],
): Quotation {
	return {
		id: row.id,
		quotationNumber: row.quotation_number,
		quotationDate: row.quotation_date,
		status: row.status,
		customer: {
			name: row.customer_name,
			address: row.customer_address,
			phone: row.customer_phone,
			email: row.customer_email,
		},
		items: items.map(mapQuotationItemRow),
		isDeleted: row.is_deleted === 1,
		deletedAt: row.deleted_at,
		deletedBy: row.deleted_by,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		createdBy: row.created_by,
		updatedBy: row.updated_by,
		statusChangedAt: row.status_changed_at,
	};
}

export function mapQuotationItemRow(row: QuotationItemRow): QuotationItem {
	return {
		id: row.id,
		category: row.category,
		quantity: row.quantity,
		rate: row.rate,
		otRate: row.ot_rate,
	};
}

export function mapApprovalStepRow(row: ApprovalStepRow): ApprovalStep {
	return {
		id: row.id,
		quotationId: row.quotation_id,
		approverName: row.approver_name,
		approverId: row.approver_id,
		approverEmail: row.approver_email,
		decision: row.decision,
		comment: row.comment,
		requestedAt: row.requested_at,
		approvedAt: row.approved_at,
	};
}

export function mapQuotationListItemRow(row: QuotationRow): QuotationListItem {
	return {
		id: row.id,
		quotationNumber: row.quotation_number,
		quotationDate: row.quotation_date,
		status: row.status,
		customerName: row.customer_name,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}
