import { z } from "@hono/zod-openapi";
import { QuotationStatusSchema } from "./common";

export const CustomerSchema = z
	.object({
		name: z.string().min(1).openapi({ example: "Acme Construction Ltd" }),
		address: z
			.string()
			.min(1)
			.openapi({ example: "123 Industrial Ave, Dubai, UAE" }),
		phone: z.string().min(1).openapi({ example: "+971501234567" }),
		email: z.string().email().openapi({ example: "contact@acme.example" }),
	})
	.openapi("Customer");

export const QuotationItemSchema = z
	.object({
		id: z
			.string()
			.uuid()
			.optional()
			.openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
		category: z.string().min(1).openapi({ example: "General Labour" }),
		quantity: z.string().min(1).openapi({ example: "10" }),
		rate: z.string().min(1).openapi({ example: "3500.00" }),
		otRate: z.string().min(1).openapi({ example: "5250.00" }),
	})
	.openapi("QuotationItem");

export const QuotationSchema = z
	.object({
		id: z
			.string()
			.uuid()
			.openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
		quotationNumber: z.string().openapi({ example: "QT-20260625-0001" }),
		quotationDate: z
			.number()
			.int()
			.openapi({ description: "UNIX epoch timestamp", example: 1719273600 }),
		status: QuotationStatusSchema,
		customer: CustomerSchema,
		items: z.array(QuotationItemSchema),
		isDeleted: z.boolean().openapi({ example: false }),
		deletedAt: z.string().datetime().nullable().openapi({ example: null }),
		deletedBy: z.string().nullable().openapi({ example: null }),
		createdAt: z
			.string()
			.datetime()
			.openapi({ example: "2026-06-25T10:00:00.000Z" }),
		updatedAt: z
			.string()
			.datetime()
			.openapi({ example: "2026-06-25T10:00:00.000Z" }),
		createdBy: z.string().openapi({ example: "user-001" }),
		updatedBy: z.string().openapi({ example: "user-001" }),
		statusChangedAt: z
			.string()
			.datetime()
			.nullable()
			.openapi({ example: null }),
	})
	.openapi("Quotation");

export const QuotationListItemSchema = z
	.object({
		id: z
			.string()
			.uuid()
			.openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
		quotationNumber: z.string().openapi({ example: "QT-20260625-0001" }),
		quotationDate: z.number().int().openapi({ example: 1719273600 }),
		status: QuotationStatusSchema,
		customerName: z.string().openapi({ example: "Acme Construction Ltd" }),
		createdAt: z
			.string()
			.datetime()
			.openapi({ example: "2026-06-25T10:00:00.000Z" }),
		updatedAt: z
			.string()
			.datetime()
			.openapi({ example: "2026-06-25T10:00:00.000Z" }),
	})
	.openapi("QuotationListItem");

export const CreateDraftRequestSchema = z
	.object({
		quotationDate: z
			.number()
			.int()
			.optional()
			.openapi({ description: "UNIX epoch timestamp; defaults to now" }),
		customer: CustomerSchema,
		items: z.array(QuotationItemSchema.omit({ id: true })).min(1),
		createdBy: z.string().min(1).openapi({ example: "user-001" }),
	})
	.openapi("CreateDraftRequest");

export const UpdateDraftRequestSchema = z
	.object({
		quotationDate: z.number().int().optional(),
		customer: CustomerSchema.optional(),
		items: z.array(QuotationItemSchema).min(1).optional(),
		updatedBy: z.string().min(1).openapi({ example: "user-001" }),
	})
	.openapi("UpdateDraftRequest");

export const QuotationIdParamSchema = z
	.object({
		id: z
			.string()
			.uuid()
			.openapi({
				param: { name: "id", in: "path" },
				example: "550e8400-e29b-41d4-a716-446655440000",
			}),
	})
	.openapi("QuotationIdParam");

export const QuotationDataResponseSchema = z
	.object({
		success: z.literal(true),
		data: QuotationSchema,
	})
	.openapi("QuotationDataResponse");

export const DeleteQuotationQuerySchema = z
	.object({
		deletedBy: z
			.string()
			.min(1)
			.openapi({
				param: { name: "deletedBy", in: "query" },
				example: "user-001",
			}),
	})
	.openapi("DeleteQuotationQuery");

export const ListQuotationsQuerySchema = z
	.object({
		page: z.coerce
			.number()
			.int()
			.min(1)
			.optional()
			.openapi({
				param: { name: "page", in: "query" },
				example: 1,
			}),
		pageSize: z.coerce
			.number()
			.int()
			.min(1)
			.max(100)
			.optional()
			.openapi({
				param: { name: "pageSize", in: "query" },
				example: 20,
			}),
		status: QuotationStatusSchema.optional().openapi({
			param: { name: "status", in: "query" },
		}),
		search: z.string().optional().openapi({
			param: { name: "search", in: "query" },
			description: "Filter by customer name or quotation number",
			example: "Acme",
		}),
		dateFrom: z.coerce
			.number()
			.int()
			.optional()
			.openapi({
				param: { name: "dateFrom", in: "query" },
				description: "Minimum quotation date (UNIX epoch)",
			}),
		dateTo: z.coerce
			.number()
			.int()
			.optional()
			.openapi({
				param: { name: "dateTo", in: "query" },
				description: "Maximum quotation date (UNIX epoch)",
			}),
		sortBy: z
			.enum(["created_at", "quotation_date", "quotation_number"])
			.optional()
			.openapi({
				param: { name: "sortBy", in: "query" },
				example: "created_at",
			}),
		sortOrder: z
			.enum(["asc", "desc"])
			.optional()
			.openapi({
				param: { name: "sortOrder", in: "query" },
				example: "desc",
			}),
	})
	.openapi("ListQuotationsQuery");

export const ListQuotationsResponseSchema = z
	.object({
		success: z.literal(true),
		data: z.object({
			items: z.array(QuotationListItemSchema),
			total: z.number().int(),
			page: z.number().int(),
			pageSize: z.number().int(),
		}),
	})
	.openapi("ListQuotationsResponse");

export const PdfProxyResponseSchema = z
	.object({
		success: z.literal(true),
		data: z
			.string()
			.openapi({
				description: "PDF URL, base64, or string returned by the external PDF service",
				example: "https://cdn.example.com/quotations/QT-20260625-0001.pdf",
			}),
	})
	.openapi("PdfProxyResponse");

export type Customer = z.infer<typeof CustomerSchema>;
export type QuotationItem = z.infer<typeof QuotationItemSchema>;
export type Quotation = z.infer<typeof QuotationSchema>;
export type QuotationListItem = z.infer<typeof QuotationListItemSchema>;
export type CreateDraftRequest = z.infer<typeof CreateDraftRequestSchema>;
export type UpdateDraftRequest = z.infer<typeof UpdateDraftRequestSchema>;
