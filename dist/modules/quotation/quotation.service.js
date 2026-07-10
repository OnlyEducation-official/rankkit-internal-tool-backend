"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationService = void 0;
const AppError_1 = require("../../common/errors/AppError");
const generateQuotationNumber_1 = require("../../common/utils/generateQuotationNumber");
const quotation_repository_1 = require("./quotation.repository");
const createQuotation = async (payload) => {
    const quotationPayload = {
        quotationNumber: (0, generateQuotationNumber_1.generateQuotationNumber)(),
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
    return quotation_repository_1.quotationRepository.createQuotation(quotationPayload);
};
const getAllQuotationsServices = async () => {
    const quotation = await quotation_repository_1.quotationRepository.getQuotationsRepository();
    return quotation;
};
const getQuotationByIdService = async (id) => {
    const quotation = await quotation_repository_1.quotationRepository.quotationByIdRepository(id);
    if (!quotation) {
        throw AppError_1.AppError.notFound("Quotation not found");
    }
    return quotation;
};
const updateQuotationService = async (id, payload) => {
    // separate items from rest
    const { items, ...rest } = payload;
    const updateData = {
        ...rest,
    };
    // convert dates if present
    if (payload.quotationDate) {
        updateData.quotationDate = new Date(payload.quotationDate);
    }
    if (payload.validTill) {
        updateData.validTill = new Date(payload.validTill);
    }
    return quotation_repository_1.quotationRepository.updateQuotationRepository(id, {
        data: updateData,
        items,
    });
};
const deleteQuotationService = async (id) => {
    return quotation_repository_1.quotationRepository.deleteQuotationRepository(id);
};
const getAllQuotationsService = async (query) => {
    return quotation_repository_1.quotationRepository.getAllQuotationsRepository(query);
};
exports.quotationService = {
    createQuotation,
    getAllQuotationsServices,
    getQuotationByIdService,
    updateQuotationService,
    deleteQuotationService,
    getAllQuotationsService
};
