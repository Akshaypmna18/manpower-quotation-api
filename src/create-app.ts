import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { createMarkdownFromOpenApi } from "@scalar/openapi-to-markdown";

import { createDbClient } from "./infra/db";
import { QuotationRepository } from "./infra/repository/quotation.repository";
import { PdfService } from "./infra/services/pdf.service";
import { QuotationService } from "./infra/services/quotation.service";

import { registerRoutes } from "./routes";

import type { AppEnv } from "./types";

const openApiDocumentConfig = {
  openapi: "3.1.0" as const,
  info: {
    title: "Manpower Quotation API",
    version: "1.0.0",
    description: "API-first Manpower Quotation Management System MVP",
  },
  tags: [
    {
      name: "Draft",
      description: "Create and manage quotation drafts.",
    },
    {
      name: "Approval",
      description: "Quotation approval workflow.",
    },
    {
      name: "Quotation",
      description: "Quotation CRUD operations.",
    },
    {
      name: "Dashboard",
      description: "Dashboard metrics.",
    },
  ],
};

export function createQuotationApp() {
  const app = new OpenAPIHono<AppEnv>();

  app.use("*", async (c, next) => {
    const db = createDbClient(c.env.DB);

    const quotationRepository = new QuotationRepository(db);

    const pdfService = new PdfService(c.env.PDF_SERVICE_URL);

    const quotationService = new QuotationService(
      quotationRepository,
      pdfService,
    );

    c.set("quotationRepository", quotationRepository);

    c.set("quotationService", quotationService);

    await next();
  });

  const withApiRoutes = registerRoutes(app);

  withApiRoutes.doc("/api/doc", {
    openapi: "3.0.0",
    info: openApiDocumentConfig.info,
    tags: openApiDocumentConfig.tags,
  });

  withApiRoutes.get("/api/scalar", (c, next) =>
    Scalar<AppEnv>({
      url: "/api/doc",
      pageTitle: openApiDocumentConfig.info.title,
    })(c as never, next),
  );

  withApiRoutes.get("/api/llms.txt", async (c) => {
    const content = withApiRoutes.getOpenAPI31Document(openApiDocumentConfig);

    const markdown = await createMarkdownFromOpenApi(JSON.stringify(content));

    return c.text(markdown);
  });

  return withApiRoutes;
}

const app = createQuotationApp();

export default app;
