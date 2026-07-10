"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quotation_controller_1 = require("./quotation.controller");
const quotation_validation_1 = require("./quotation.validation");
const validateRequest_1 = require("../../common/middleware/validateRequest");
const router = (0, express_1.Router)();
router.post("/createQuotations", (0, validateRequest_1.validateRequest)(quotation_validation_1.quotationValidation.createQuotation), quotation_controller_1.quotationController.createQuotation);
router.get("/getAllQuotations", (0, validateRequest_1.validateRequest)(quotation_validation_1.quotationValidation.getAllQuotations), quotation_controller_1.quotationController.getAllQuotationsController);
// router.get("/getAllQuotations", quotationController.getAllQuotationsController)
router.get("/:id", (0, validateRequest_1.validateRequest)(quotation_validation_1.quotationValidation.getQuotationById), quotation_controller_1.quotationController.getQuotationByIdController);
router.patch("/:id", (0, validateRequest_1.validateRequest)(quotation_validation_1.quotationValidation.updateQuotation), quotation_controller_1.quotationController.updateQuotationController);
router.delete("/:id", (0, validateRequest_1.validateRequest)(quotation_validation_1.quotationValidation.deleteQuotation), quotation_controller_1.quotationController.deleteQuotationController);
exports.default = router;
