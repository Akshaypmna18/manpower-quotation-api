import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import type { Bindings } from "./env";
import { approvalRoutes } from "./routes/approval";
import { dashboardRoutes } from "./routes/dashboard";
import { draftRoutes } from "./routes/draft";
import { quotationRoutes } from "./routes/quotation";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.route("/api", draftRoutes);
app.route("/api", approvalRoutes);
app.route("/api", quotationRoutes);
app.route("/api", dashboardRoutes);

// OpenAPI JSON specification
app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "Manpower Quotation API",
		description: "API-first Manpower Quotation Management System MVP",
	},
	servers: [
		{
			url: "http://localhost:8788",
			description: "Local development",
		},
	],
	tags: [
		{ name: "Draft", description: "Create and update quotation drafts" },
		{ name: "Approval", description: "Submit for approval and send to client" },
		{ name: "Quotation", description: "Retrieve, list, approve, reject, and delete quotations" },
		{ name: "Dashboard", description: "Aggregated metrics and recent activity" },
	],
});

app.get("/openapi.json", (c) => c.redirect("/doc"));

// Scalar API reference UI
app.get(
	"/docs",
	apiReference({
		theme: "purple",
		spec: {
			url: "/doc",
		},
	})
);

// Fallback redirect from root to docs
app.get("/", (c) => c.redirect("/docs"));

export default app;
export type { Bindings } from "./env";
