import { generateQuotationNumber } from "../../common/utils/generateQuotationNumber";
import { quotationRepository } from "./quotation.repository";
import type { TCreateQuotationBody, TGetAllQuotationsQuery, TUpdateQuotationBody } from "./quotation.validation";

const createQuotation = async (payload: TCreateQuotationBody) => {
  const quotationPayload = {
    quotationNumber: generateQuotationNumber(),

    companyName: payload.companyName,
    companyAddress: payload.companyAddress,
    companyPhone: payload.companyPhone,
    companyEmail: payload.companyEmail,

    companyType: payload.companyType,

    clientName: payload.clientName,
    clientAddress: payload.clientAddress || '',
    clientPhone: payload.clientPhone || '',
    clientEmail: payload.clientEmail || '',

    quotationDate: new Date(payload.quotationDate),
    validTill: new Date(payload.validTill),

    discount: payload.discount,
    grandTotal: payload.grandTotal,
    notes: payload.notes || '',
    customTerms: payload.customTerms,
    salesPersonName: payload.salesPersonName,

    items: {
      create: payload.items.map((item) => ({
        title: item.title,
        description: item.description || null,
        rate: item.rate,
      })),
    },
  };

  return quotationRepository.createQuotation(quotationPayload);
};

const getAllQuotationsServices = async () => {
  const quotation = await quotationRepository.getQuotationsRepository()

  return quotation
}

const getQuotationByIdService = async (id: string) => {

  const quotation = await quotationRepository.quotationByIdRepository(id);

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  return quotation;

}

const updateQuotationService = async (
  id: string,
  payload: TUpdateQuotationBody
) => {
  // separate items from rest
  const { items, ...rest } = payload;

  const updateData: any = {
    ...rest,
  };

  // convert dates if present
  if (payload.quotationDate) {
    updateData.quotationDate = new Date(payload.quotationDate);
  }

  if (payload.validTill) {
    updateData.validTill = new Date(payload.validTill);
  }

  return quotationRepository.updateQuotationRepository(id, {
    data: updateData,
    items,
  });
};

const deleteQuotationService = async (id: string) => {
  return quotationRepository.deleteQuotationRepository(id);
};

const getAllQuotationsService = async (query: TGetAllQuotationsQuery) => {
  return quotationRepository.getAllQuotationsRepository(query);
};

export const quotationService = {
  createQuotation,
  getAllQuotationsServices,
  getQuotationByIdService,
  updateQuotationService,
  deleteQuotationService,
  getAllQuotationsService
};