import type { ApprovalDecision, QuotationStatus } from "../schemas/common";
import type { ApprovalStep } from "../schemas/approval";
import type { Quotation, QuotationItem, QuotationListItem } from "../schemas/quotation";
import {
	type ApprovalStepRow,
	type CreateApprovalStepInput,
	type CreateQuotationInput,
	type ListQuotationsParams,
	mapApprovalStepRow,
	mapQuotationListItemRow,
	mapQuotationRow,
	type QuotationItemRow,
	type QuotationRow,
	type UpdateQuotationInput,
} from "./types";

const SORT_COLUMNS = {
	created_at: "created_at",
	quotation_date: "quotation_date",
	quotation_number: "quotation_number",
} as const;

export class QuotationRepository {
	constructor(private readonly db: D1Database) {}

	async generateQuotationNumber(quotationDate: number): Promise<string> {
		const date = new Date(quotationDate * 1000);
		const y = date.getUTCFullYear();
		const m = String(date.getUTCMonth() + 1).padStart(2, "0");
		const d = String(date.getUTCDate()).padStart(2, "0");
		const prefix = `QT-${y}${m}${d}-`;

		const result = await this.db
			.prepare(
				`SELECT COUNT(*) AS count FROM quotations WHERE quotation_number LIKE ?`,
			)
			.bind(`${prefix}%`)
			.first<{ count: number }>();

		const seq = (result?.count ?? 0) + 1;
		return `${prefix}${String(seq).padStart(4, "0")}`;
	}

	async insertQuotation(input: CreateQuotationInput): Promise<Quotation> {
		const statements = [
			this.db
				.prepare(
					`INSERT INTO quotations (
            id, quotation_number, quotation_date, status,
            customer_name, customer_address, customer_phone, customer_email,
            is_deleted, created_at, updated_at, created_by, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
				)
				.bind(
					input.id,
					input.quotationNumber,
					input.quotationDate,
					input.status,
					input.customer.name,
					input.customer.address,
					input.customer.phone,
					input.customer.email,
					input.now,
					input.now,
					input.createdBy,
					input.createdBy,
				),
			...input.items.map((item) => {
				const itemId = crypto.randomUUID();
				return this.db
					.prepare(
						`INSERT INTO quotation_items (
              id, quotation_id, category, quantity, rate, ot_rate
            ) VALUES (?, ?, ?, ?, ?, ?)`,
					)
					.bind(
						itemId,
						input.id,
						item.category,
						item.quantity,
						item.rate,
						item.otRate,
					);
			}),
		];

		await this.db.batch(statements);

		const quotation = await this.findById(input.id);
		if (!quotation) {
			throw new Error("Failed to create quotation");
		}
		return quotation;
	}

	async findById(
		id: string,
		options?: { includeDeleted?: boolean },
	): Promise<Quotation | null> {
		const includeDeleted = options?.includeDeleted ?? false;
		const row = await this.db
			.prepare(
				includeDeleted
					? `SELECT * FROM quotations WHERE id = ?`
					: `SELECT * FROM quotations WHERE id = ? AND is_deleted = 0`,
			)
			.bind(id)
			.first<QuotationRow>();

		if (!row) {
			return null;
		}

		const items = await this.findItemsByQuotationId(id);
		return mapQuotationRow(row, items);
	}

	async findItemsByQuotationId(
		quotationId: string,
	): Promise<QuotationItemRow[]> {
		const result = await this.db
			.prepare(
				`SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY category ASC`,
			)
			.bind(quotationId)
			.all<QuotationItemRow>();

		return result.results ?? [];
	}

	async updateQuotation(
		id: string,
		input: UpdateQuotationInput,
	): Promise<Quotation | null> {
		const existing = await this.findById(id);
		if (!existing) {
			return null;
		}

		const customer = input.customer ?? existing.customer;
		const quotationDate = input.quotationDate ?? existing.quotationDate;

		const statements: D1PreparedStatement[] = [
			this.db
				.prepare(
					`UPDATE quotations SET
            quotation_date = ?,
            customer_name = ?,
            customer_address = ?,
            customer_phone = ?,
            customer_email = ?,
            updated_at = ?,
            updated_by = ?
          WHERE id = ? AND is_deleted = 0`,
				)
				.bind(
					quotationDate,
					customer.name,
					customer.address,
					customer.phone,
					customer.email,
					input.now,
					input.updatedBy,
					id,
				),
		];

		if (input.items) {
			statements.push(
				this.db
					.prepare(`DELETE FROM quotation_items WHERE quotation_id = ?`)
					.bind(id),
				...input.items.map((item) => {
					const itemId = item.id ?? crypto.randomUUID();
					return this.db
						.prepare(
							`INSERT INTO quotation_items (
                id, quotation_id, category, quantity, rate, ot_rate
              ) VALUES (?, ?, ?, ?, ?, ?)`,
						)
						.bind(
							itemId,
							id,
							item.category,
							item.quantity,
							item.rate,
							item.otRate,
						);
				}),
			);
		}

		await this.db.batch(statements);
		return this.findById(id);
	}

	async softDelete(id: string, deletedBy: string, now: string): Promise<boolean> {
		const result = await this.db
			.prepare(
				`UPDATE quotations SET
          is_deleted = 1,
          deleted_at = ?,
          deleted_by = ?,
          updated_at = ?,
          updated_by = ?
        WHERE id = ? AND is_deleted = 0`,
			)
			.bind(now, deletedBy, now, deletedBy, id)
			.run();

		return (result.meta.changes ?? 0) > 0;
	}

	async updateStatus(
		id: string,
		status: QuotationStatus,
		updatedBy: string,
		now: string,
	): Promise<boolean> {
		const result = await this.db
			.prepare(
				`UPDATE quotations SET
          status = ?,
          status_changed_at = ?,
          updated_at = ?,
          updated_by = ?
        WHERE id = ? AND is_deleted = 0`,
			)
			.bind(status, now, now, updatedBy, id)
			.run();

		return (result.meta.changes ?? 0) > 0;
	}

	async insertApprovalStep(
		input: CreateApprovalStepInput,
	): Promise<ApprovalStep> {
		await this.db
			.prepare(
				`INSERT INTO approval_steps (
          id, quotation_id, approver_name, approver_id, approver_email,
          decision, requested_at
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
			)
			.bind(
				input.id,
				input.quotationId,
				input.approverName,
				input.approverId,
				input.approverEmail,
				input.requestedAt,
			)
			.run();

		const step = await this.findApprovalStepById(input.id);
		if (!step) {
			throw new Error("Failed to create approval step");
		}
		return step;
	}

	async findApprovalStepById(id: string): Promise<ApprovalStep | null> {
		const row = await this.db
			.prepare(`SELECT * FROM approval_steps WHERE id = ?`)
			.bind(id)
			.first<ApprovalStepRow>();

		return row ? mapApprovalStepRow(row) : null;
	}

	async findApprovalStepsByQuotationId(
		quotationId: string,
	): Promise<ApprovalStep[]> {
		const result = await this.db
			.prepare(
				`SELECT * FROM approval_steps WHERE quotation_id = ? ORDER BY requested_at DESC`,
			)
			.bind(quotationId)
			.all<ApprovalStepRow>();

		return (result.results ?? []).map(mapApprovalStepRow);
	}

	async updateApprovalDecision(
		id: string,
		decision: Exclude<ApprovalDecision, "PENDING">,
		comment: string | null,
		approvedAt: string,
	): Promise<boolean> {
		const result = await this.db
			.prepare(
				`UPDATE approval_steps SET
          decision = ?,
          comment = ?,
          approved_at = ?
        WHERE id = ? AND decision = 'PENDING'`,
			)
			.bind(decision, comment, approvedAt, id)
			.run();

		return (result.meta.changes ?? 0) > 0;
	}

	async listQuotations(
		params: ListQuotationsParams = {},
	): Promise<{ items: QuotationListItem[]; total: number }> {
		const page = params.page ?? 1;
		const pageSize = params.pageSize ?? 20;
		const sortBy = SORT_COLUMNS[params.sortBy ?? "created_at"];
		const sortOrder = params.sortOrder === "asc" ? "ASC" : "DESC";
		const offset = (page - 1) * pageSize;

		const conditions = ["is_deleted = 0"];
		const bindings: (string | number)[] = [];

		if (params.status) {
			conditions.push("status = ?");
			bindings.push(params.status);
		}

		if (params.search) {
			conditions.push(
				"(customer_name LIKE ? OR quotation_number LIKE ?)",
			);
			const term = `%${params.search}%`;
			bindings.push(term, term);
		}

		if (params.dateFrom !== undefined) {
			conditions.push("quotation_date >= ?");
			bindings.push(params.dateFrom);
		}

		if (params.dateTo !== undefined) {
			conditions.push("quotation_date <= ?");
			bindings.push(params.dateTo);
		}

		const whereClause = conditions.join(" AND ");

		const countResult = await this.db
			.prepare(`SELECT COUNT(*) AS count FROM quotations WHERE ${whereClause}`)
			.bind(...bindings)
			.first<{ count: number }>();

		const listResult = await this.db
			.prepare(
				`SELECT * FROM quotations
         WHERE ${whereClause}
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT ? OFFSET ?`,
			)
			.bind(...bindings, pageSize, offset)
			.all<QuotationRow>();

		return {
			items: (listResult.results ?? []).map(mapQuotationListItemRow),
			total: countResult?.count ?? 0,
		};
	}

	async countByStatus(): Promise<Record<QuotationStatus, number>> {
		const result = await this.db
			.prepare(
				`SELECT status, COUNT(*) AS count
         FROM quotations
         WHERE is_deleted = 0
         GROUP BY status`,
			)
			.all<{ status: QuotationStatus; count: number }>();

		const counts: Record<QuotationStatus, number> = {
			DRAFT: 0,
			PENDING_APPROVAL: 0,
			APPROVED: 0,
			SENT: 0,
			REJECTED: 0,
		};

		for (const row of result.results ?? []) {
			counts[row.status] = row.count;
		}

		return counts;
	}

	async getRecentQuotations(limit = 5): Promise<QuotationListItem[]> {
		const result = await this.db
			.prepare(
				`SELECT * FROM quotations
         WHERE is_deleted = 0
         ORDER BY created_at DESC
         LIMIT ?`,
			)
			.bind(limit)
			.all<QuotationRow>();

		return (result.results ?? []).map(mapQuotationListItemRow);
	}
}
