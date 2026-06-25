import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { Bindings } from "../env";
import { ErrorResponseSchema } from "../schemas/common";
import {
	SendToClientRequestSchema,
	SubmitApprovalRequestSchema,
} from "../schemas/approval";
import { QuotationDataResponseSchema } from "../schemas/quotation";
import {
	createQuotationService,
	handleServiceError,
} from "./utils";

const submitApprovalRoute = createRoute({
	method: "post",
	path: "/submit-approval",
	tags: ["Approval"],
	summary: "Submit a quotation for approval",
	request: {
		body: {
			content: {
				"application/json": {
					schema: SubmitApprovalRequestSchema,
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
			description: "Quotation submitted for approval",
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
			description: "Quotation cannot be submitted in its current status",
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

const sendToClientRoute = createRoute({
	method: "post",
	path: "/send-to-client",
	tags: ["Approval"],
	summary: "Mark an approved quotation as sent to client",
	request: {
		body: {
			content: {
				"application/json": {
					schema: SendToClientRequestSchema,
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
			description: "Quotation marked as sent",
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
			description: "Quotation must be approved before sending to client",
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

export const approvalRoutes = new OpenAPIHono<{ Bindings: Bindings }>();

approvalRoutes.openapi(submitApprovalRoute, async (c) => {
	try {
		const body = c.req.valid("json");
		const quotation =
			await createQuotationService(c.env.DB).submitForApproval(body);
		return c.json({ success: true as const, data: quotation }, 200);
	} catch (error) {
		return handleServiceError(c, error);
	}
});

approvalRoutes.openapi(sendToClientRoute, async (c) => {
	try {
		const body = c.req.valid("json");
		const quotation =
			await createQuotationService(c.env.DB).sendToClient(body);
		return c.json({ success: true as const, data: quotation }, 200);
	} catch (error) {
		return handleServiceError(c, error);
	}
});
