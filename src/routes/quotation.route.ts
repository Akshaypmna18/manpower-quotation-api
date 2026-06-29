import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types";

import {
  deleteQuotationQuerySchema,
  errorResponseSchema,
  listQuotationsQuerySchema,
  listQuotationsResponseSchema,
  pdfProxyResponseSchema,
  quotationIdParamSchema,
  quotationResponseSchema,
} from "./schema";

const listQuotationsRoute = createRoute({
  method: "get",
  path: "/api/quotations",
  tags: ["Quotation"],
  summary: "List quotations",
  request: {
    query: listQuotationsQuerySchema,
  },
  responses: {
    200: {
      description: "Quotation list.",
      content: {
        "application/json": {
          schema: listQuotationsResponseSchema,
        },
      },
    },
    400: {
      description: "Unable to list quotations.",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getQuotationRoute = createRoute({
  method: "get",
  path: "/api/quotations/{id}",
  tags: ["Quotation"],
  summary: "Get quotation",
  request: {
    params: quotationIdParamSchema,
  },
  responses: {
    200: {
      description: "Quotation found.",
      content: {
        "application/json": {
          schema: quotationResponseSchema,
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

const deleteQuotationRoute = createRoute({
  method: "delete",
  path: "/api/quotations/{id}",
  tags: ["Quotation"],
  summary: "Delete quotation",
  request: {
    params: quotationIdParamSchema,
    query: deleteQuotationQuerySchema,
  },
  responses: {
    200: {
      description: "Quotation deleted.",
      content: {
        "application/json": {
          schema: quotationResponseSchema,
        },
      },
    },
  },
});

const generatePdfRoute = createRoute({
  method: "post",
  path: "/api/quotations/{id}/pdf/generate",
  tags: ["Quotation"],
  summary: "Generate quotation PDF",
  request: {
    params: quotationIdParamSchema,
  },
  responses: {
    200: {
      description: "PDF generated.",
      content: {
        "application/json": {
          schema: pdfProxyResponseSchema,
        },
      },
    },
  },
});

const downloadPdfRoute = createRoute({
  method: "get",
  path: "/api/quotations/{id}/pdf/download",
  tags: ["Quotation"],
  summary: "Download quotation PDF",
  request: {
    params: quotationIdParamSchema,
  },
  responses: {
    200: {
      description: "PDF downloaded.",
      content: {
        "application/json": {
          schema: pdfProxyResponseSchema,
        },
      },
    },
  },
});

export function registerQuotationRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(listQuotationsRoute, async (c) => {
    try {
      const query = c.req.valid("query");

      const result = await c.var.quotationService.listQuotations(query);

      return c.json({
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error listing quotations.",
        },
        error?.status ?? 400,
      ) as any;
    }
  });

  app.openapi(getQuotationRoute, async (c) => {
    try {
      const { id } = c.req.valid("param");

      const quotation = await c.var.quotationService.getQuotation(id);

      return c.json({
        message: "Quotation retrieved.",
        data: quotation,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error retrieving quotation.",
        },
        error?.status ?? 400,
      ) as any;
    }
  });

  app.openapi(deleteQuotationRoute, async (c) => {
    try {
      const { id } = c.req.valid("param");
      const { deletedBy } = c.req.valid("query");

      const quotation = await c.var.quotationService.deleteQuotation(
        id,
        deletedBy,
      );

      return c.json({
        message: "Quotation deleted.",
        data: quotation,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error deleting quotation.",
        },
        error?.status ?? 400,
      ) as any;
    }
  });

  app.openapi(generatePdfRoute, async (c) => {
    try {
      const { id } = c.req.valid("param");

      const pdf = await c.var.quotationService.generatePdf(id);

      return c.json({
        data: pdf,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error generating PDF.",
        },
        error?.status ?? 400,
      ) as any;
    }
  });

  app.openapi(downloadPdfRoute, async (c) => {
    try {
      const { id } = c.req.valid("param");

      const pdf = await c.var.quotationService.downloadPdf(id);

      return c.json({
        data: pdf,
      });
    } catch (error: any) {
      return c.json(
        {
          message: error?.message ?? "Error downloading PDF.",
        },
        error?.status ?? 400,
      ) as any;
    }
  });

  return app;
}
