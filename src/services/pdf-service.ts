import type { Quotation } from "../schemas/quotation";
import { ServiceError } from "./errors";

export class PdfService {
	constructor(private readonly pdfServiceUrl: string) {}

	async generate(quotation: Quotation): Promise<string> {
		return this.forward("POST", this.pdfServiceUrl, quotation);
	}

	async download(quotation: Quotation): Promise<string> {
		const url = this.buildDownloadUrl(quotation.id);
		return this.forward("POST", url, quotation);
	}

	private buildDownloadUrl(quotationId: string): string {
		if (this.pdfServiceUrl.endsWith("/generate")) {
			return `${this.pdfServiceUrl.slice(0, -"/generate".length)}/download/${quotationId}`;
		}

		return `${this.pdfServiceUrl.replace(/\/$/, "")}/download/${quotationId}`;
	}

	private async forward(
		method: "POST",
		url: string,
		quotation: Quotation,
	): Promise<string> {
		const response = await fetch(url, {
			method,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json, text/plain, */*",
			},
			body: JSON.stringify(quotation),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "Unknown error");
			console.error("PDF service error:", response.status, errorText);
			throw new ServiceError(
				502,
				`PDF service request failed with status ${response.status}`,
			);
		}

		return response.text();
	}
}

export function createPdfService(pdfServiceUrl: string): PdfService {
	return new PdfService(pdfServiceUrl);
}
