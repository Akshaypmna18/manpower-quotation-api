import type { QuotationRepository } from "./infra/repository/quotation.repository";
import type { QuotationService } from "./infra/services/quotation.service";

export type AppEnv = {
  Bindings: {
    DB: D1Database;
    PDF_SERVICE_URL: string;
  };

  Variables: {
    quotationRepository: QuotationRepository;
    quotationService: QuotationService;
  };
};