import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types";

import {
  createQuotationSchema,
  errorResponseSchema,
  quotationIdParamSchema,
  quotationResponseSchema,
  updateQuotationSchema,
} from "./schema";

const createDraftRoute = createRoute({
  method: "post",
  path: "/api/drafts",
  tags: ["Draft"],
  summary: "Create quotation draft",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createQuotationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Quotation draft created.",
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

const updateDraftRoute = createRoute({
  method: "put",
  path: "/api/drafts/{id}",
  tags: ["Draft"],
  summary: "Update quotation draft",
  request: {
    params: quotationIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateQuotationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Quotation draft updated.",
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

export function registerDraftRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(createDraftRoute, async (c) => {
    try {
      const body = c.req.valid("json");

      const quotation =
        await c.var.quotationService.createDraft(body);

      return c.json(
        {
          message: "Quotation draft created.",
          data: quotation,
        },
        201,
      );
    } catch (error: any) {
      console.error(error);

      return c.json(
        {
          message: error?.message ?? "Error creating draft.",
        },
        error?.status ?? 400,
      );
    }
  });

  app.openapi(updateDraftRoute, async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const quotation =
        await c.var.quotationService.updateDraft(id, body);

      return c.json({
        message: "Quotation draft updated.",
        data: quotation,
      });
    } catch (error: any) {
      console.error(error);

      return c.json(
        {
          message: error?.message ?? "Error updating draft.",
        },
        error?.status ?? 400,
      );
    }
  });

  return app;
}