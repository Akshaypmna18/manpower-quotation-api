import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types";

import { registerDraftRoutes } from "./draft.route";
import { registerApprovalRoutes } from "./approval.route";
import { registerQuotationRoutes } from "./quotation.route";
import { registerDashboardRoutes } from "./dashboard.route";

export function registerRoutes(app: OpenAPIHono<AppEnv>) {
  registerDraftRoutes(app);
  registerApprovalRoutes(app);
  registerQuotationRoutes(app);
  registerDashboardRoutes(app);

  return app;
}