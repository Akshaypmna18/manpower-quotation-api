import { QuotationRepository } from "../repository/quotation.repository";
import { PdfService } from "./pdf.service";
import { ServiceError } from "./errors";

import type {
  ApprovalDecisionRequest,
  CreateQuotationInput,
  DashboardMetrics,
  Quotation,
  QuotationListItem,
  SendToClientRequest,
  SubmitApprovalRequest,
  UpdateQuotationInput,
} from "../../routes/schema";

import type { ListQuotationsParams } from "../repository/types";

const EDITABLE_STATUSES = new Set(["DRAFT", "REJECTED"]);
const SUBMITTABLE_STATUSES = new Set(["DRAFT", "REJECTED"]);

export class QuotationService {
  constructor(
    private readonly repo: QuotationRepository,
    private readonly pdfService: PdfService,
  ) {}

  async createDraft(input: CreateQuotationInput): Promise<Quotation> {
    const now = new Date().toISOString();
    const quotationDate = input.quotationDate ?? Math.floor(Date.now() / 1000);

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
      createdBy: input.createdBy ?? "system",
      now,
    });
  }

  async updateDraft(
    id: string,
    input: UpdateQuotationInput,
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

    const quotation = await this.repo.updateQuotation(id, {
      quotationDate: input.quotationDate,
      customer: input.customer,
      items: input.items,
      updatedBy: input.updatedBy ?? "system",
      now: new Date().toISOString(),
    });

    if (!quotation) {
      throw new ServiceError(404, "Quotation not found");
    }

    return quotation;
  }

  async submitForApproval(input: SubmitApprovalRequest): Promise<Quotation> {
    const quotation = await this.repo.findById(input.id);

    if (!quotation) {
      throw new ServiceError(404, "Quotation not found");
    }

    if (!SUBMITTABLE_STATUSES.has(quotation.status)) {
      throw new ServiceError(
        403,
        `Quotation in status ${quotation.status} cannot be submitted for approval`,
      );
    }

    const now = new Date().toISOString();

    try {
      await this.repo.submitForApproval(
        input.id,
        {
          approverName: input.approverName,
          approverId: input.approverId,
          approverEmail: input.approverEmail,
        },
        input.submittedBy,
        now,
      );
    } catch {
      throw new ServiceError(500, "Failed to submit quotation for approval");
    }

    const updatedQuotation = await this.repo.findById(input.id);

    if (!updatedQuotation) {
      throw new ServiceError(404, "Quotation not found after submission");
    }

    return updatedQuotation;
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

  async sendToClient(input: SendToClientRequest): Promise<Quotation> {
    const quotation = await this.repo.findById(input.id);

    if (!quotation) {
      throw new ServiceError(404, "Quotation not found");
    }

    if (quotation.status !== "APPROVED") {
      throw new ServiceError(
        403,
        "Only approved quotations can be sent to a client",
      );
    }

    const now = new Date().toISOString();

    const statusUpdated = await this.repo.updateStatus(
      input.id,
      "SENT",
      input.sentBy,
      now,
    );

    if (!statusUpdated) {
      throw new ServiceError(500, "Failed to send quotation to client");
    }

    const updatedQuotation = await this.repo.findById(input.id);

    if (!updatedQuotation) {
      throw new ServiceError(404, "Quotation not found after sending");
    }

    return updatedQuotation;
  }

  async getQuotation(id: string): Promise<Quotation> {
    const quotation = await this.repo.findById(id);

    if (!quotation) {
      throw new ServiceError(404, "Quotation not found");
    }

    return quotation;
  }

  async listQuotations(params: ListQuotationsParams = {}): Promise<{
    items: QuotationListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return this.repo.listQuotations(params);
  }

  async getDashboardMetrics(recentLimit = 5): Promise<DashboardMetrics> {
    const countsByStatus = await this.repo.countByStatus();

    const total = Object.values(countsByStatus).reduce(
      (sum, value) => sum + value,
      0,
    );

    const recent = await this.repo.getRecentQuotations(recentLimit);

    return {
      countsByStatus,
      total,
      recent,
    };
  }

  async deleteQuotation(id: string, deletedBy: string): Promise<Quotation> {
    const quotation = await this.repo.findById(id);

    if (!quotation) {
      throw new ServiceError(404, "Quotation not found");
    }

    const deletedAt = new Date().toISOString();
    const deleted = await this.repo.softDelete(id, deletedBy, deletedAt);

    if (!deleted) {
      throw new ServiceError(500, "Failed to delete quotation");
    }

    const deletedQuotation = await this.repo.findById(id, {
      includeDeleted: true,
    });

    if (!deletedQuotation) {
      throw new ServiceError(404, "Quotation not found after deletion");
    }

    return deletedQuotation;
  }

  async generatePdf(id: string): Promise<string> {
    const quotation = await this.getQuotation(id);

    return this.pdfService.generate(quotation);
  }

  async downloadPdf(id: string): Promise<string> {
    const quotation = await this.getQuotation(id);

    return this.pdfService.download(id, quotation);
  }

  private async decideQuotation(
    id: string,
    input: ApprovalDecisionRequest,
    decision: "APPROVED" | "REJECTED",
  ): Promise<Quotation> {
    const quotation = await this.repo.findById(id);

    if (!quotation) {
      throw new ServiceError(404, "Quotation not found");
    }

    if (quotation.status !== "PENDING_APPROVAL") {
      throw new ServiceError(
        403,
        `Quotation in status ${quotation.status} cannot be decided`,
      );
    }

    const approvalSteps = await this.repo.findApprovalStepsByQuotationId(id);
    const pendingStep = approvalSteps.find(
      (step) => step.decision === "PENDING",
    );

    if (!pendingStep) {
      throw new ServiceError(
        404,
        "No pending approval step found for this quotation",
      );
    }

    const now = new Date().toISOString();

    try {
      await this.repo.decideApproval(
        id,
        pendingStep.id,
        decision,
        input.approvedBy,
        input.comment ?? null,
        now,
      );
    } catch {
      throw new ServiceError(500, "Failed to update approval decision");
    }

    const updatedQuotation = await this.repo.findById(id);

    if (!updatedQuotation) {
      throw new ServiceError(404, "Quotation not found after decision");
    }

    return updatedQuotation;
  }
}
