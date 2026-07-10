"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const quotation_validation_1 = require("./quotation.validation");
const validQuotation = (description) => ({
    companyName: "Rankkit",
    companyAddress: "Pune",
    companyPhone: "1234567890",
    companyEmail: "accounts@example.com",
    clientName: "Client",
    clientAddress: "",
    clientPhone: "",
    companyType: "Agency",
    clientEmail: "",
    quotationDate: "2026-07-10",
    validTill: "2026-07-11",
    discount: 0,
    grandTotal: 100,
    notes: "",
    customTerms: [],
    salesPersonName: "Sales Person",
    items: [{ title: "Long description", description, rate: 100 }],
});
(0, node_test_1.default)("accepts a quotation item description at the configured boundary", () => {
    const description = "x".repeat(quotation_validation_1.QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH);
    strict_1.default.equal(quotation_validation_1.createQuotationBodySchema.safeParse(validQuotation(description)).success, true);
});
(0, node_test_1.default)("accepts representative HTML, line breaks, and emoji", () => {
    const description = "<p>First line</p>\n<p>Second line 😀</p>";
    const result = quotation_validation_1.createQuotationBodySchema.safeParse(validQuotation(description));
    strict_1.default.equal(result.success, true);
    if (result.success) {
        strict_1.default.equal(result.data.items[0].description, description);
    }
});
(0, node_test_1.default)("rejects a quotation item description above the configured boundary", () => {
    const description = "x".repeat(quotation_validation_1.QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH + 1);
    const result = quotation_validation_1.createQuotationBodySchema.safeParse(validQuotation(description));
    strict_1.default.equal(result.success, false);
    if (!result.success) {
        const issue = result.error.issues.find(({ path }) => path.join(".") === "items.0.description");
        strict_1.default.equal(issue?.code, "too_big");
        strict_1.default.equal("maximum" in (issue ?? {}) ? issue.maximum : undefined, quotation_validation_1.QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH);
    }
});
