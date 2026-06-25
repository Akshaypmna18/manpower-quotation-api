import { QuotationRepository } from "../repository/quotation-repo";
import { ServiceError } from "../services/errors";
import { createPdfService as buildPdfService } from "../services/pdf-service";
import { QuotationService } from "../services/quotation-service";

export function createQuotationService(db: D1Database): QuotationService {
	return new QuotationService(new QuotationRepository(db));
}

export function createPdfService(pdfServiceUrl: string) {
	return buildPdfService(pdfServiceUrl);
}

type JsonContext = {
	json: (body: unknown, status: number) => Response;
};

export function handleServiceError(c: JsonContext, error: unknown): Response {
	if (error instanceof ServiceError) {
		return c.json({ success: false, error: error.message }, error.status);
	}
	console.error(error);
	return c.json({ success: false, error: "Internal server error" }, 500);
}
