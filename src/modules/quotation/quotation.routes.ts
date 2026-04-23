import { Router } from "express";
import { quotationController } from "./quotation.controller";
import { quotationValidation } from "./quotation.validation";
import { validateRequest } from "../../common/middleware/validateRequest";

const router = Router();

router.post(
  "/createQuotations",
  validateRequest(quotationValidation.createQuotation),
  quotationController.createQuotation 
);

router.get(
  "/getAllQuotations",
  validateRequest(quotationValidation.getAllQuotations),
  quotationController.getAllQuotationsController
);


// router.get("/getAllQuotations", quotationController.getAllQuotationsController)

router.get(
  "/:id",
  validateRequest(quotationValidation.getQuotationById),
  quotationController.getQuotationByIdController
);

router.patch(
  "/:id",
  validateRequest(quotationValidation.updateQuotation),
  quotationController.updateQuotationController
);

router.delete(
  "/:id",
  validateRequest(quotationValidation.deleteQuotation),
  quotationController.deleteQuotationController
);


export default router;