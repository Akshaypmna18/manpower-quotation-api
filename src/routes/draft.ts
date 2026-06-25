import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { Bindings } from "../env";
import { ErrorResponseSchema } from "../schemas/common";
import {
	CreateDraftRequestSchema,
	QuotationDataResponseSchema,
	QuotationIdParamSchema,
	UpdateDraftRequestSchema,
} from "../schemas/quotation";
import {
	createQuotationService,
	handleServiceError,
} from "./utils";

const createDraftRoute = createRoute({
	method: "post",
	path: "/draft",
	tags: ["Draft"],
	summary: "Create a quotation draft",
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateDraftRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: QuotationDataResponseSchema,
				},
			},
			description: "Draft quotation created",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Validation error",
		},
	},
});

const updateDraftRoute = createRoute({
	method: "put",
	path: "/draft/{id}",
	tags: ["Draft"],
	summary: "Update a quotation draft",
	request: {
		params: QuotationIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateDraftRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: QuotationDataResponseSchema,
				},
			},
			description: "Draft quotation updated",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Validation error",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Quotation is not editable in its current status",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Quotation not found",
		},
	},
});

export const draftRoutes = new OpenAPIHono<{ Bindings: Bindings }>();

draftRoutes.openapi(createDraftRoute, async (c) => {
	try {
		const body = c.req.valid("json");
		const quotation = await createQuotationService(c.env.DB).createDraft(body);
		return c.json({ success: true as const, data: quotation }, 201);
	} catch (error) {
		return handleServiceError(c, error);
	}
});

draftRoutes.openapi(updateDraftRoute, async (c) => {
	try {
		const { id } = c.req.valid("param");
		const body = c.req.valid("json");
		const quotation = await createQuotationService(c.env.DB).updateDraft(id, body);
		return c.json({ success: true as const, data: quotation }, 200);
	} catch (error) {
		return handleServiceError(c, error);
	}
});
