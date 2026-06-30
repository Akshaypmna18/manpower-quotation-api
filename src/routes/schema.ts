import { z } from "@hono/zod-openapi";

export const QUOTATION_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "REJECTED",
] as const;

export const APPROVAL_DECISIONS = ["PENDING", "APPROVED", "REJECTED"] as const;

export const quotationStatusSchema = z.enum(QUOTATION_STATUSES).openapi({
  description: "Current quotation lifecycle status",
  example: "DRAFT",
});

export const approvalDecisionSchema = z.enum(APPROVAL_DECISIONS).openapi({
  description: "Approval decision",
  example: "PENDING",
});

export const customerSchema = z
  .object({
    name: z.string().min(1).openapi({
      example: "Acme Construction Ltd",
    }),
    address: z.string().min(1).openapi({
      example: "Dubai, UAE",
    }),
    phone: z.string().min(1).openapi({
      example: "+971501234567",
    }),
    email: z.string().email().openapi({
      example: "contact@acme.com",
    }),
  })
  .openapi("Customer");

export const quotationItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    category: z.string().min(1).openapi({
      example: "General Labour",
    }),
    quantity: z
      .union([z.string(), z.number()])
      .transform((value) => String(value))
      .openapi({
        example: "10",
      }),
    rate: z
      .union([z.string(), z.number()])
      .transform((value) => String(value))
      .openapi({
        example: "3500.00",
      }),
    otRate: z
      .union([z.string(), z.number()])
      .transform((value) => String(value))
      .openapi({
        example: "5250.00",
      }),
  })
  .openapi("QuotationItem");

export const quotationSchema = z
  .object({
    id: z.string().uuid(),

    quotationNumber: z.string(),

    quotationDate: z.number().int(),

    status: quotationStatusSchema,

    customer: customerSchema,

    items: z.array(quotationItemSchema),

    isDeleted: z.boolean(),

    deletedAt: z.string().datetime().nullable(),

    deletedBy: z.string().nullable(),

    createdAt: z.string().datetime(),

    updatedAt: z.string().datetime(),

    createdBy: z.string(),

    updatedBy: z.string(),

    statusChangedAt: z.string().datetime().nullable(),
  })
  .openapi("Quotation");

export const quotationListItemSchema = z
  .object({
    id: z.string().uuid(),
    quotationNumber: z.string(),
    quotationDate: z.number().int(),
    status: quotationStatusSchema,
    customerName: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("QuotationListItem");

export const approvalStepSchema = z
  .object({
    id: z.string().uuid(),
    quotationId: z.string().uuid(),
    approverName: z.string(),
    approverId: z.string(),
    approverEmail: z.string().email(),
    decision: approvalDecisionSchema,
    comment: z.string().nullable(),
    requestedAt: z.string().datetime(),
    approvedAt: z.string().datetime().nullable(),
  })
  .openapi("ApprovalStep");

export const createQuotationSchema = z
  .object({
    quotationDate: z.number().int().optional(),

    customer: customerSchema,

    items: z.array(
      quotationItemSchema.omit({
        id: true,
      }),
    ),

    createdBy: z.string().optional().default("system"),
  })
  .openapi("CreateQuotationRequest");

export const updateQuotationSchema = z
  .object({
    quotationDate: z.number().int().optional(),

    customer: customerSchema.optional(),

    items: z.array(quotationItemSchema).optional(),

    updatedBy: z.string().optional().default("system"),
  })
  .openapi("UpdateQuotationRequest");

export const approvalDecisionRequestSchema = z
  .object({
    approvedBy: z.string().openapi({
      example: "reviewer-123",
    }),
    comment: z.string().optional().nullable().openapi({
      example: "Looks good.",
    }),
  })
  .openapi("ApprovalDecisionRequest");

export const submitApprovalRequestSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: "b2a3c7e1-8f45-4fe5-9a4c-123456789abc",
    }),
    approverName: z.string().openapi({
      example: "Ayesha Khan",
    }),
    approverId: z.string().openapi({
      example: "approver-001",
    }),
    approverEmail: z.string().email().openapi({
      example: "approver@example.com",
    }),
    submittedBy: z.string().openapi({
      example: "user-123",
    }),
  })
  .openapi("SubmitApprovalRequest");

export const sendToClientRequestSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: "b2a3c7e1-8f45-4fe5-9a4c-123456789abc",
    }),
    sentBy: z.string().openapi({
      example: "user-123",
    }),
  })
  .openapi("SendToClientRequest");

export const quotationIdParamSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
    }),
});

export const listQuotationsQuerySchema = z
  .object({
    status: quotationStatusSchema.optional(),
    search: z.string().optional(),
    dateFrom: z.coerce.number().int().optional(),
    dateTo: z.coerce.number().int().optional(),
    page: z.coerce.number().int().optional(),
    pageSize: z.coerce.number().int().optional(),
    sortBy: z
      .enum(["created_at", "quotation_date", "quotation_number"])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .openapi({
    description: "Quotation list query parameters",
  });

export const deleteQuotationQuerySchema = z
  .object({
    deletedBy: z.string().openapi({
      example: "user-123",
    }),
  })
  .openapi("DeleteQuotationQuery");

export const quotationResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Quotation retrieved.",
    }),
    data: quotationSchema,
  })
  .openapi("QuotationResponse");

export const listQuotationsResponseSchema = z
  .object({
    data: z.object({
      items: z.array(quotationListItemSchema),
      total: z.number().int(),
      page: z.number().int(),
      pageSize: z.number().int(),
    }),
  })
  .openapi("ListQuotationsResponse");

export const pdfProxyResponseSchema = z
  .object({
    data: z.string(),
  })
  .openapi("PdfProxyResponse");

export const dashboardMetricsSchema = z
  .object({
    countsByStatus: z.record(z.string(), z.number()),
    total: z.number().int(),
    recent: z.array(quotationListItemSchema),
  })
  .openapi("DashboardMetrics");

export const dashboardMetricsResponseSchema = z
  .object({
    data: dashboardMetricsSchema,
  })
  .openapi("DashboardMetricsResponse");

export const errorResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Quotation not found.",
    }),
  })
  .openapi("ErrorResponse");

export type Customer = z.infer<typeof customerSchema>;

export type QuotationItem = z.infer<typeof quotationItemSchema>;

export type Quotation = z.infer<typeof quotationSchema>;

export type QuotationListItem = z.infer<typeof quotationListItemSchema>;

export type ApprovalStep = z.infer<typeof approvalStepSchema>;

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;

export type ApprovalDecisionRequest = z.infer<
  typeof approvalDecisionRequestSchema
>;

export type SubmitApprovalRequest = z.infer<typeof submitApprovalRequestSchema>;

export type SendToClientRequest = z.infer<typeof sendToClientRequestSchema>;

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

export type QuotationStatus = z.infer<typeof quotationStatusSchema>;
