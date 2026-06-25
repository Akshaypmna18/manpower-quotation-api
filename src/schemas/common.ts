import { z } from "@hono/zod-openapi";

export const QuotationStatusSchema = z
	.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "REJECTED"])
	.openapi({
		description: "Quotation lifecycle status",
		example: "DRAFT",
	});

export const ApprovalDecisionSchema = z
	.enum(["PENDING", "APPROVED", "REJECTED"])
	.openapi({
		description: "Approver decision on a quotation",
		example: "PENDING",
	});

export const ErrorResponseSchema = z
	.object({
		success: z.literal(false),
		error: z.string().openapi({ example: "Resource not found" }),
	})
	.openapi("ErrorResponse");

export const SuccessResponseSchema = z
	.object({
		success: z.literal(true),
	})
	.openapi("SuccessResponse");

export type QuotationStatus = z.infer<typeof QuotationStatusSchema>;
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;
