import { Router } from "express";
import { quotationController } from "./quotation.controller";
import { quotationValidation } from "./quotation.validation";
import { validateRequest } from "../../common/middleware/validateRequest";
import { authMiddleware } from "../../common/middleware/auth.middleware";
import { checkPermission } from "../../common/middleware/permission.middleware";

const router = Router();

router.post(
  "/createQuotations",
  authMiddleware,
  validateRequest(quotationValidation.createQuotation),
  checkPermission("QUOTATION", "canCreate"),
  quotationController.createQuotation 
);

router.get(
  "/getAllQuotations",
  authMiddleware,
  validateRequest(quotationValidation.getAllQuotations),
  checkPermission("QUOTATION", "canRead"),
  quotationController.getAllQuotationsController
);

// router.get("/getAllQuotations", quotationController.getAllQuotationsController)

router.get(
  "/:id",
  authMiddleware,
  validateRequest(quotationValidation.getQuotationById),
  checkPermission("QUOTATION", "canRead"),
  quotationController.getQuotationByIdController
);

router.patch(
  "/:id",
  authMiddleware,
  validateRequest(quotationValidation.updateQuotation),
  checkPermission("QUOTATION", "canUpdate"),
  quotationController.updateQuotationController
);

router.delete(
  "/:id",
  authMiddleware,
  validateRequest(quotationValidation.deleteQuotation),
  checkPermission("QUOTATION", "canDelete"),
  quotationController.deleteQuotationController
);


export default router;