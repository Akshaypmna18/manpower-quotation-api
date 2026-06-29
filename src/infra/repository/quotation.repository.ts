import { type Kysely } from "kysely";

import type { DatabaseSchema } from "../db/schema";

import {
  toApprovalStep,
  toQuotation,
  toQuotationItem,
  toQuotationListItem,
} from "./quotation.mapper";

import type {
  ApprovalStep,
  Quotation,
  QuotationListItem,
  QuotationStatus,
} from "../../routes/schema";

import type { FindQuotationOptions, ListQuotationsParams } from "./types";

export class QuotationRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async generateQuotationNumber(quotationDate: number): Promise<string> {
    const year = new Date(quotationDate * 1000).getUTCFullYear();

    const prefix = `QT-${year}`;

    const result = await this.db
      .selectFrom("quotations")
      .select((eb) => [eb.fn.count("id").as("count")])
      .where("quotation_number", "like", `${prefix}%`)
      .executeTakeFirst();

    const next = Number(result?.count ?? 0) + 1;

    return `${prefix}-${String(next).padStart(4, "0")}`;
  }

  async insertQuotation(input: {
    id: string;
    quotationNumber: string;
    quotationDate: number;
    status: string;

    customer: {
      name: string;
      address: string;
      phone: string;
      email: string;
    };

    items: Array<{
      category: string;
      quantity: string;
      rate: string;
      otRate: string;
    }>;

    createdBy: string;
    now: string;
  }): Promise<Quotation> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto("quotations")
        .values({
          id: input.id,

          quotation_number: input.quotationNumber,

          quotation_date: input.quotationDate,

          status: input.status,

          customer_name: input.customer.name,

          customer_address: input.customer.address,

          customer_phone: input.customer.phone,

          customer_email: input.customer.email,

          created_at: input.now,
          updated_at: input.now,

          created_by: input.createdBy,
          updated_by: input.createdBy,

          status_changed_at: input.now,
        })
        .execute();

      if (input.items.length > 0) {
        await trx
          .insertInto("quotation_items")
          .values(
            input.items.map((item) => ({
              id: crypto.randomUUID(),

              quotation_id: input.id,

              category: item.category,

              quantity: item.quantity,

              rate: item.rate,

              ot_rate: item.otRate,
            })),
          )
          .execute();
      }
    });

    const quotation = await this.findById(input.id);

    if (!quotation) {
      throw new Error("Failed to load quotation after insert");
    }

    return quotation;
  }

  async updateQuotation(
    id: string,
    input: {
      quotationDate?: number;

      customer?: {
        name: string;
        address: string;
        phone: string;
        email: string;
      };

      items?: Array<{
        id?: string;
        category: string;
        quantity: string;
        rate: string;
        otRate: string;
      }>;

      updatedBy: string;
      now: string;
    },
  ): Promise<Quotation | null> {
    const update: Record<string, unknown> = {
      updated_at: input.now,
      updated_by: input.updatedBy,
    };

    if (input.quotationDate !== undefined) {
      update.quotation_date = input.quotationDate;
    }

    if (input.customer) {
      update.customer_name = input.customer.name;

      update.customer_address = input.customer.address;

      update.customer_phone = input.customer.phone;

      update.customer_email = input.customer.email;
    }

    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable("quotations")
        .set(update)
        .where("id", "=", id)
        .execute();

      if (input.items) {
        await trx
          .deleteFrom("quotation_items")
          .where("quotation_id", "=", id)
          .execute();

        if (input.items.length > 0) {
          await trx
            .insertInto("quotation_items")
            .values(
              input.items.map((item) => ({
                id: item.id ?? crypto.randomUUID(),

                quotation_id: id,

                category: item.category,

                quantity: item.quantity,

                rate: item.rate,

                ot_rate: item.otRate,
              })),
            )
            .execute();
        }
      }
    });

    return this.findById(id);
  }

  async updateStatus(
    id: string,
    status: QuotationStatus,
    updatedBy: string,
    now: string,
  ): Promise<boolean> {
    const result = await this.db
      .updateTable("quotations")
      .set({
        status,

        updated_by: updatedBy,

        updated_at: now,

        status_changed_at: now,
      })
      .where("id", "=", id)
      .executeTakeFirst();

    return Number(result.numUpdatedRows) > 0;
  }

  async findById(
    id: string,
    options: FindQuotationOptions = {},
  ): Promise<Quotation | null> {
    let query = this.db
      .selectFrom("quotations")
      .selectAll()
      .where("id", "=", id);

    if (!options.includeDeleted) {
      query = query.where("is_deleted", "=", 0);
    }

    const quotation = await query.executeTakeFirst();

    if (!quotation) {
      return null;
    }

    const itemRows = await this.db
      .selectFrom("quotation_items")
      .selectAll()
      .where("quotation_id", "=", id)
      .execute();

    const items = itemRows.map(toQuotationItem);

    return toQuotation(quotation, items);
  }

  async findApprovalStepsByQuotationId(
    quotationId: string,
  ): Promise<ApprovalStep[]> {
    const rows = await this.db
      .selectFrom("approval_steps")
      .selectAll()
      .where("quotation_id", "=", quotationId)
      .orderBy("requested_at", "asc")
      .execute();

    return rows.map(toApprovalStep);
  }

  async createApprovalStep(
    quotationId: string,
    approver: {
      approverName: string;
      approverId: string;
      approverEmail: string;
    },
  ): Promise<void> {
    await this.db
      .insertInto("approval_steps")
      .values({
        id: crypto.randomUUID(),
        quotation_id: quotationId,
        approver_name: approver.approverName,
        approver_id: approver.approverId,
        approver_email: approver.approverEmail,
        decision: "PENDING",
        comment: null,
        requested_at: new Date().toISOString(),
        approved_at: null,
      })
      .execute();
  }

  async updateApprovalDecision(
    id: string,
    decision: "APPROVED" | "REJECTED",
    comment: string | null,
    approvedAt: string,
  ): Promise<boolean> {
    const result = await this.db
      .updateTable("approval_steps")
      .set({
        decision,
        comment,
        approved_at: approvedAt,
      })
      .where("id", "=", id)
      .where("decision", "=", "PENDING")
      .executeTakeFirst();

    return Number(result.numUpdatedRows) > 0;
  }

  async softDelete(
    id: string,
    deletedBy: string,
    deletedAt: string,
  ): Promise<boolean> {
    const result = await this.db
      .updateTable("quotations")
      .set({
        is_deleted: 1,

        deleted_by: deletedBy,
        deleted_at: deletedAt,

        updated_by: deletedBy,
        updated_at: deletedAt,
      })
      .where("id", "=", id)
      .where("is_deleted", "=", 0)
      .executeTakeFirst();

    return Number(result.numUpdatedRows) > 0;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await this.db
      .selectFrom("quotations")
      .select(["status", (eb) => eb.fn.count("id").as("count")])
      .where("is_deleted", "=", 0)
      .groupBy("status")
      .execute();

    const counts = {
      DRAFT: 0,
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      SENT: 0,
      REJECTED: 0,
    };

    for (const row of rows) {
      counts[row.status as keyof typeof counts] = Number(row.count);
    }

    return counts;
  }

  async getRecentQuotations(limit = 5): Promise<QuotationListItem[]> {
    const rows = await this.db
      .selectFrom("quotations")
      .selectAll()
      .where("is_deleted", "=", 0)
      .orderBy("created_at", "desc")
      .limit(limit)
      .execute();

    return rows.map(toQuotationListItem);
  }

  async listQuotations(params: ListQuotationsParams = {}): Promise<{
    items: QuotationListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = params.page ?? 1;

    const pageSize = params.pageSize ?? 20;

    let query = this.db
      .selectFrom("quotations")
      .selectAll()
      .where("is_deleted", "=", 0);

    if (params.status) {
      query = query.where("status", "=", params.status);
    }

    if (params.search) {
      query = query.where((eb) =>
        eb.or([
          eb("customer_name", "like", `%${params.search}%`),
          eb("quotation_number", "like", `%${params.search}%`),
        ]),
      );
    }

    if (params.dateFrom) {
      query = query.where("quotation_date", ">=", params.dateFrom);
    }

    if (params.dateTo) {
      query = query.where("quotation_date", "<=", params.dateTo);
    }

    const totalResult = await query
      .select((eb) => eb.fn.count("id").as("count"))
      .executeTakeFirst();

    const total = Number(totalResult?.count ?? 0);

    const rows = await query
      .orderBy(params.sortBy ?? "created_at", params.sortOrder ?? "desc")
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return {
      items: rows.map(toQuotationListItem),
      total,
      page,
      pageSize,
    };
  }
}
