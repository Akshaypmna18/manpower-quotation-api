import { QuotationRepository } from "../repository/quotation-repo";
import type {
	CreateDraftRequest,
	Quotation,
	QuotationListItem,
	UpdateDraftRequest,
} from "../schemas/quotation";
import type { DashboardMetrics } from "../schemas/dashboard";
import type { ListQuotationsParams } from "../repository/types";
import type {
	ApprovalDecisionRequest,
	SendToClientRequest,
	SubmitApprovalRequest,
} from "../schemas/approval";
import { ServiceError } from "./errors";

const EDITABLE_STATUSES = new Set(["DRAFT", "REJECTED"]);
const SUBMITTABLE_STATUSES = new Set(["DRAFT", "REJECTED"]);

export class QuotationService {
	constructor(private readonly repo: QuotationRepository) {}

	async createDraft(input: CreateDraftRequest): Promise<Quotation> {
		const now = new Date().toISOString();
		const quotationDate =
			input.quotationDate ?? Math.floor(Date.now() / 1000);
		const id = crypto.randomUUID();
		const quotationNumber =
			await this.repo.generateQuotationNumber(quotationDate);

		return this.repo.insertQuotation({
			id,
			quotationNumber,
			quotationDate,
			status: "DRAFT",
			customer: input.customer,
			items: input.items,
			createdBy: input.createdBy,
			now,
		});
	}

	async updateDraft(
		id: string,
		input: UpdateDraftRequest,
	): Promise<Quotation> {
		const existing = await this.repo.findById(id);
		if (!existing) {
			throw new ServiceError(404, "Quotation not found");
		}

		if (!EDITABLE_STATUSES.has(existing.status)) {
			throw new ServiceError(
				403,
				`Cannot update quotation in ${existing.status} status`,
			);
		}

		const updated = await this.repo.updateQuotation(id, {
			quotationDate: input.quotationDate,
			customer: input.customer,
			items: input.items,
			updatedBy: input.updatedBy,
			now: new Date().toISOString(),
		});

		if (!updated) {
			throw new ServiceError(404, "Quotation not found");
		}

		return updated;
	}

	async submitForApproval(input: SubmitApprovalRequest): Promise<Quotation> {
		const existing = await this.repo.findById(input.quotationId);
		if (!existing) {
			throw new ServiceError(404, "Quotation not found");
		}

		if (!SUBMITTABLE_STATUSES.has(existing.status)) {
			throw new ServiceError(
				403,
				`Cannot submit quotation in ${existing.status} status for approval`,
			);
		}

		const now = new Date().toISOString();

		await this.repo.insertApprovalStep({
			id: crypto.randomUUID(),
			quotationId: input.quotationId,
			approverName: input.approver.approverName,
			approverId: input.approver.approverId,
			approverEmail: input.approver.approverEmail,
			requestedAt: now,
		});

		const updated = await this.repo.updateStatus(
			input.quotationId,
			"PENDING_APPROVAL",
			input.requestedBy,
			now,
		);

		if (!updated) {
			throw new ServiceError(404, "Quotation not found");
		}

		const quotation = await this.repo.findById(input.quotationId);
		if (!quotation) {
			throw new ServiceError(404, "Quotation not found");
		}

		return quotation;
	}

	async sendToClient(input: SendToClientRequest): Promise<Quotation> {
		const existing = await this.repo.findById(input.quotationId);
		if (!existing) {
			throw new ServiceError(404, "Quotation not found");
		}

		if (existing.status !== "APPROVED") {
			throw new ServiceError(
				403,
				`Cannot send quotation to client in ${existing.status} status`,
			);
		}

		const now = new Date().toISOString();
		const updated = await this.repo.updateStatus(
			input.quotationId,
			"SENT",
			input.sentBy,
			now,
		);

		if (!updated) {
			throw new ServiceError(404, "Quotation not found");
		}

		const quotation = await this.repo.findById(input.quotationId);
		if (!quotation) {
			throw new ServiceError(404, "Quotation not found");
		}

		return quotation;
	}

	async approveQuotation(
		id: string,
		input: ApprovalDecisionRequest,
	): Promise<Quotation> {
		return this.decideQuotation(id, input, "APPROVED");
	}

	async rejectQuotation(
		id: string,
		input: ApprovalDecisionRequest,
	): Promise<Quotation> {
		return this.decideQuotation(id, input, "REJECTED");
	}

	async getQuotation(id: string): Promise<Quotation> {
		const quotation = await this.repo.findById(id);
		if (!quotation) {
			throw new ServiceError(404, "Quotation not found");
		}
		return quotation;
	}

	async listQuotations(
		params: ListQuotationsParams = {},
	): Promise<{
		items: QuotationListItem[];
		total: number;
		page: number;
		pageSize: number;
	}> {
		const page = params.page ?? 1;
		const pageSize = params.pageSize ?? 20;
		const result = await this.repo.listQuotations({ ...params, page, pageSize });
		return { ...result, page, pageSize };
	}

	async getDashboardMetrics(recentLimit = 5): Promise<DashboardMetrics> {
		const countsByStatus = await this.repo.countByStatus();
		const total = Object.values(countsByStatus).reduce(
			(sum, count) => sum + count,
			0,
		);
		const recent = await this.repo.getRecentQuotations(recentLimit);
		return { countsByStatus, total, recent };
	}

	async deleteQuotation(id: string, deletedBy: string): Promise<Quotation> {
		const existing = await this.repo.findById(id);
		if (!existing) {
			throw new ServiceError(404, "Quotation not found");
		}

		const now = new Date().toISOString();
		const deleted = await this.repo.softDelete(id, deletedBy, now);
		if (!deleted) {
			throw new ServiceError(404, "Quotation not found");
		}

		const quotation = await this.repo.findById(id, { includeDeleted: true });
		if (!quotation) {
			throw new ServiceError(404, "Quotation not found");
		}

		return quotation;
	}

	private async decideQuotation(
		id: string,
		input: ApprovalDecisionRequest,
		decision: "APPROVED" | "REJECTED",
	): Promise<Quotation> {
		const existing = await this.repo.findById(id);
		if (!existing) {
			throw new ServiceError(404, "Quotation not found");
		}

		if (existing.status !== "PENDING_APPROVAL") {
			throw new ServiceError(
				403,
				`Cannot ${decision === "APPROVED" ? "approve" : "reject"} quotation in ${existing.status} status`,
			);
		}

		const steps = await this.repo.findApprovalStepsByQuotationId(id);
		const pendingStep = steps.find((step) => step.decision === "PENDING");
		if (!pendingStep) {
			throw new ServiceError(404, "No pending approval step found");
		}

		const now = new Date().toISOString();
		const stepUpdated = await this.repo.updateApprovalDecision(
			pendingStep.id,
			decision,
			input.comment ?? null,
			now,
		);

		if (!stepUpdated) {
			throw new ServiceError(409, "Approval step has already been decided");
		}

		const statusUpdated = await this.repo.updateStatus(
			id,
			decision,
			input.decidedBy,
			now,
		);

		if (!statusUpdated) {
			throw new ServiceError(404, "Quotation not found");
		}

		const quotation = await this.repo.findById(id);
		if (!quotation) {
			throw new ServiceError(404, "Quotation not found");
		}

		return quotation;
	}
}
