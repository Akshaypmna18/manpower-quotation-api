import { z } from "@hono/zod-openapi";
import { ApprovalDecisionSchema } from "./common";

export const ApproverSchema = z
	.object({
		approverName: z.string().min(1).openapi({ example: "Jane Manager" }),
		approverId: z.string().min(1).openapi({ example: "approver-001" }),
		approverEmail: z
			.string()
			.email()
			.openapi({ example: "jane.manager@example.com" }),
	})
	.openapi("Approver");

export const ApprovalStepSchema = z
	.object({
		id: z
			.string()
			.uuid()
			.openapi({ example: "550e8400-e29b-41d4-a716-446655440002" }),
		quotationId: z
			.string()
			.uuid()
			.openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
		approverName: z.string().openapi({ example: "Jane Manager" }),
		approverId: z.string().openapi({ example: "approver-001" }),
		approverEmail: z
			.string()
			.email()
			.openapi({ example: "jane.manager@example.com" }),
		decision: ApprovalDecisionSchema,
		comment: z.string().nullable().openapi({ example: null }),
		requestedAt: z
			.string()
			.datetime()
			.nullable()
			.openapi({ example: "2026-06-25T11:00:00.000Z" }),
		approvedAt: z.string().datetime().nullable().openapi({ example: null }),
	})
	.openapi("ApprovalStep");

export const SubmitApprovalRequestSchema = z
	.object({
		quotationId: z
			.string()
			.uuid()
			.openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
		approver: ApproverSchema,
		requestedBy: z.string().min(1).openapi({ example: "user-001" }),
	})
	.openapi("SubmitApprovalRequest");

export const SendToClientRequestSchema = z
	.object({
		quotationId: z
			.string()
			.uuid()
			.openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
		sentBy: z.string().min(1).openapi({ example: "user-001" }),
	})
	.openapi("SendToClientRequest");

export const ApprovalDecisionRequestSchema = z
	.object({
		comment: z
			.string()
			.optional()
			.openapi({ example: "Approved for client delivery" }),
		decidedBy: z.string().min(1).openapi({ example: "approver-001" }),
	})
	.openapi("ApprovalDecisionRequest");

export type Approver = z.infer<typeof ApproverSchema>;
export type ApprovalStep = z.infer<typeof ApprovalStepSchema>;
export type SubmitApprovalRequest = z.infer<typeof SubmitApprovalRequestSchema>;
export type SendToClientRequest = z.infer<typeof SendToClientRequestSchema>;
export type ApprovalDecisionRequest = z.infer<
	typeof ApprovalDecisionRequestSchema
>;
