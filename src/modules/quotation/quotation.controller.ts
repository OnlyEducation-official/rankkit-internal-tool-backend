// quotation.controller.ts
import type { Request, Response } from "express";
import { quotationService } from "./quotation.service";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendResponse } from "../../common/utils/sendResponse";
import { success } from "zod";
import { TGetAllQuotationsQuery } from "./quotation.validation";

type Params = {
  id: string;
};

const createQuotation = catchAsync(async (req: Request, res: Response) => {
  await quotationService.createQuotation(req.body);

  sendResponse(res ? {
    res,
    statusCode: 201,
    success: true,
    message: "Quotation created successfully",
    meta: {
      action: "CREATE_QUOTATION",
    },
  } : undefined as never);
});

// const getAllQuotationsController = async (_req: Request, res: Response) => {
//   const result = await quotationService.getAllQuotationsServices();

//   res.status(200).json({
//     success: true,
//     message: "Quotations fetched successfully",
//     data: result,
//   })

// }

const getQuotationByIdController = async (req: Request<Params>, res: Response) => {

  const { id } = req.params;

  const result = await quotationService.getQuotationByIdService(id);

  res.status(200).json({
    success: true,
    message: "Quotation fetched successfully",
    data: result,
  });

}

const updateQuotationController = async (
  req: Request<Params>,
  res: Response
) => {
  const { id } = req.params;

  const result = await quotationService.updateQuotationService(id, req.body);

  res.status(200).json({
    success: true,
    message: "Quotation updated successfully",
    data: result,
  });
};

const deleteQuotationController = async (
  req: Request<Params>,
  res: Response
) => {
  const { id } = req.params;

  await quotationService.deleteQuotationService(id);

  res.status(200).json({
    success: true,
    message: "Quotation deleted successfully",
    data: null,
  });
};

const getAllQuotationsController = async (req: Request, res: Response) => {
  const query = (res.locals.validatedQuery ?? {}) as TGetAllQuotationsQuery;

  const result = await quotationService.getAllQuotationsService(query);

  res.status(200).json({
    success: true,
    message: "Quotations fetched successfully",
    meta: result.meta,
    data: result.data,
  });
};

export const quotationController = {
  createQuotation,
  getAllQuotationsController,
  getQuotationByIdController,
  updateQuotationController,
  deleteQuotationController,
};