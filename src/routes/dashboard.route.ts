import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types";

import { dashboardMetricsResponseSchema, errorResponseSchema } from "./schema";

const dashboardMetricsRoute = createRoute({
  method: "get",
  path: "/api/dashboard/metrics",
  tags: ["Dashboard"],
  summary: "Get dashboard metrics",
  responses: {
    200: {
      description: "Dashboard metrics.",
      content: {
        "application/json": {
          schema: dashboardMetricsResponseSchema,
        },
      },
    },
    400: {
      description: "Unable to retrieve dashboard metrics.",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export function registerDashboardRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(dashboardMetricsRoute, async (c) => {
    try {
      const metrics = await c.var.quotationService.getDashboardMetrics();

      return c.json({
        data: metrics,
      });
    } catch (error: any) {
      console.error(error);

      return c.json(
        {
          message: error?.message ?? "Error retrieving dashboard metrics.",
        },
        error?.status ?? 400,
      ) as any;
    }
  });

  return app;
}
