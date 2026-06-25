import { z } from "@hono/zod-openapi";
import { QuotationListItemSchema } from "./quotation";

export const DashboardMetricsSchema = z
	.object({
		countsByStatus: z.object({
			DRAFT: z.number().int().openapi({ example: 3 }),
			PENDING_APPROVAL: z.number().int().openapi({ example: 1 }),
			APPROVED: z.number().int().openapi({ example: 2 }),
			SENT: z.number().int().openapi({ example: 4 }),
			REJECTED: z.number().int().openapi({ example: 1 }),
		}),
		total: z.number().int().openapi({ example: 11 }),
		recent: z.array(QuotationListItemSchema),
	})
	.openapi("DashboardMetrics");

export const DashboardMetricsResponseSchema = z
	.object({
		success: z.literal(true),
		data: DashboardMetricsSchema,
	})
	.openapi("DashboardMetricsResponse");

export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
