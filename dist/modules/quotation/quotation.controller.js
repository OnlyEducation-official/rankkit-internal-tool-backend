"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationController = void 0;
const quotation_service_1 = require("./quotation.service");
const catchAsync_1 = require("../../common/utils/catchAsync");
const sendResponse_1 = require("../../common/utils/sendResponse");
const createQuotation = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await quotation_service_1.quotationService.createQuotation(req.body);
    (0, sendResponse_1.sendResponse)({
        res,
        statusCode: 201,
        success: true,
        message: "Quotation created successfully",
        meta: {
            action: "CREATE_QUOTATION",
        },
    });
});
// const getAllQuotationsController = async (_req: Request, res: Response) => {
//   const result = await quotationService.getAllQuotationsServices();
//   res.status(200).json({
//     success: true,
//     message: "Quotations fetched successfully",
//     data: result,
//   })
// }
const getQuotationByIdController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const result = await quotation_service_1.quotationService.getQuotationByIdService(id);
    res.status(200).json({
        success: true,
        message: "Quotation fetched successfully",
        data: result,
    });
});
const updateQuotationController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const result = await quotation_service_1.quotationService.updateQuotationService(id, req.body);
    res.status(200).json({
        success: true,
        message: "Quotation updated successfully",
        data: result,
    });
});
const deleteQuotationController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    await quotation_service_1.quotationService.deleteQuotationService(id);
    res.status(200).json({
        success: true,
        message: "Quotation deleted successfully",
        data: null,
    });
});
const getAllQuotationsController = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const query = (res.locals.validatedQuery ?? {});
    const result = await quotation_service_1.quotationService.getAllQuotationsService(query);
    res.status(200).json({
        success: true,
        message: "Quotations fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});
exports.quotationController = {
    createQuotation,
    getAllQuotationsController,
    getQuotationByIdController,
    updateQuotationController,
    deleteQuotationController,
};
