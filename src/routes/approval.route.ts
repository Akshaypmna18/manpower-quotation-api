import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types";
import { isServiceError } from "../infra/services/errors";

import {
  approvalDecisionRequestSchema,
  errorResponseSchema,
  quotationIdParamSchema,
  quotationResponseSchema,
  sendToClientRequestSchema,
  submitApprovalRequestSchema,
} from "./schema";

const submitApprovalRoute = createRoute({
  method: "post",
  path: "/api/approvals/submit",
  tags: ["Approval"],
  summary: "Submit quotation for approval",
  request: {
    body: {
      content: {
        "application/json": {
          schema: submitApprovalRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Quotation submitted for approval.",
      content: {
        "application/json": {
          schema: quotationResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error.",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const approveQuotationRoute = createRoute({
  method: "post",
  path: "/api/approvals/{id}/approve",
  tags: ["Approval"],
  summary: "Approve quotation",
  request: {
    params: quotationIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: approvalDecisionRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Quotation approved.",
      content: {
        "application/json": {
          schema: quotationResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error.",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Quotation not found.",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const rejectQuotationRoute = createRoute({
  method: "post",
  path: "/api/approvals/{id}/reject",
  tags: ["Approval"],
  summary: "Reject quotation",
  request: {
    params: quotationIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: approvalDecisionRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Quotation rejected.",
      content: {
        "application/json": {
          schema: quotationResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error.",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const sendToClientRoute = createRoute({
  method: "post",
  path: "/api/approvals/send-to-client",
  tags: ["Approval"],
  summary: "Send quotation to client",
  request: {
    body: {
      content: {
        "application/json": {
          schema: sendToClientRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Quotation sent to client.",
      content: {
        "application/json": {
          schema: quotationResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error.",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export function registerApprovalRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(submitApprovalRoute, async (c) => {
    try {
      const body = c.req.valid("json");

      const quotation =
        await c.var.quotationService.submitForApproval(body);

      return c.json({
        message: "Quotation submitted for approval.",
        data: quotation,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error submitting quotation.",
        },
        isServiceError(error) ? error.status : 500,
      ) as any;
    }
  });

  app.openapi(approveQuotationRoute, async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const quotation =
        await c.var.quotationService.approveQuotation(id, body);

      return c.json({
        message: "Quotation approved.",
        data: quotation,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error approving quotation.",
        },
        isServiceError(error) ? error.status : 500,
      ) as any;
    }
  });

  app.openapi(rejectQuotationRoute, async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const quotation =
        await c.var.quotationService.rejectQuotation(id, body);

      return c.json({
        message: "Quotation rejected.",
        data: quotation,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error rejecting quotation.",
        },
        isServiceError(error) ? error.status : 500,
      ) as any;
    }
  });

  app.openapi(sendToClientRoute, async (c) => {
    try {
      const body = c.req.valid("json");

      const quotation =
        await c.var.quotationService.sendToClient(body);

      return c.json({
        message: "Quotation sent to client.",
        data: quotation,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error sending quotation.",
        },
        isServiceError(error) ? error.status : 500,
      ) as any;
    }
  });

  return app;
}
