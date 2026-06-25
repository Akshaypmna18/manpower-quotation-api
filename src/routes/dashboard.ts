import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { Bindings } from "../env";
import { DashboardMetricsResponseSchema } from "../schemas/dashboard";
import {
	createQuotationService,
	handleServiceError,
} from "./utils";

const dashboardMetricsRoute = createRoute({
	method: "get",
	path: "/dashboard/metrics",
	tags: ["Dashboard"],
	summary: "Get aggregated quotation metrics",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: DashboardMetricsResponseSchema,
				},
			},
			description: "Dashboard metrics retrieved",
		},
	},
});

export const dashboardRoutes = new OpenAPIHono<{ Bindings: Bindings }>();

dashboardRoutes.openapi(dashboardMetricsRoute, async (c) => {
	try {
		const metrics =
			await createQuotationService(c.env.DB).getDashboardMetrics();
		return c.json({ success: true as const, data: metrics }, 200);
	} catch (error) {
		return handleServiceError(c, error);
	}
});
