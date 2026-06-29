import { ServiceError } from "./errors";

export class PdfService {
  constructor(
    private readonly pdfServiceUrl: string,
  ) {}

  async generate(payload: unknown): Promise<string> {
    return this.forward(
      `${this.pdfServiceUrl.replace(/\/$/, "")}/generate`,
      payload,
    );
  }

  async download(
    quotationId: string,
    payload: unknown,
  ): Promise<string> {
    return this.forward(
      `${this.pdfServiceUrl.replace(/\/$/, "")}/download/${quotationId}`,
      payload,
    );
  }

  private async forward(
    url: string,
    payload: unknown,
  ): Promise<string> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response
        .text()
        .catch(() => "Unknown PDF service error");

      throw new ServiceError(
        502,
        `PDF service failed (${response.status}): ${message}`,
      );
    }

    return response.text();
  }
}