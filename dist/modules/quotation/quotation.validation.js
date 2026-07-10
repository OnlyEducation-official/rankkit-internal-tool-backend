"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationValidation = exports.getAllQuotationsQuerySchema = exports.createQuotationBodySchema = exports.quotationItemSchema = exports.QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH = void 0;
const zod_1 = require("zod");
exports.QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH = 100000;
exports.quotationItemSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(1, "Item title is required")
        .max(200, "Item title cannot exceed 200 characters"),
    description: zod_1.z
        .string()
        .trim()
        // Quotation item descriptions can be long. Keep a generous upper bound
        // (aligned with the 10mb body limit) so real content is never truncated,
        // while still guarding against unbounded/abusive input.
        .max(exports.QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH, `Item description cannot exceed ${exports.QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH} characters`)
        .optional()
        .or(zod_1.z.literal("")),
    rate: zod_1.z
        .number({ error: "Rate must be a number" })
        .min(0, "Rate cannot be negative"),
});
const baseQuotationBodySchema = zod_1.z.object({
    companyName: zod_1.z
        .string()
        .trim()
        .min(1, "Company name is required"),
    companyAddress: zod_1.z
        .string()
        .trim()
        .min(1, "Company address is required"),
    companyPhone: zod_1.z
        .string()
        .trim()
        .min(1, "Company phone is required"),
    companyEmail: zod_1.z.email("Invalid company email"),
    clientName: zod_1.z
        .string()
        .trim()
        .min(1, "Client name is required"),
    clientAddress: zod_1.z
        .string()
        .trim()
        .optional()
        .or(zod_1.z.literal("")),
    clientPhone: zod_1.z
        .string()
        .trim()
        .optional()
        .or(zod_1.z.literal("")),
    companyType: zod_1.z
        .string()
        .trim()
        .min(1, "Company Type required."),
    clientEmail: zod_1.z
        .email("Invalid client email")
        .trim()
        .optional()
        .or(zod_1.z.literal("")),
    quotationDate: zod_1.z.iso.date("Quotation date must be in YYYY-MM-DD format"),
    validTill: zod_1.z.iso.date("Valid till date must be in YYYY-MM-DD format"),
    discount: zod_1.z
        .number({ error: "Discount must be a number" })
        .min(0, "Discount cannot be negative"),
    grandTotal: zod_1.z
        .number({ error: "Grand total must be a number" })
        .min(0, "Grand total cannot be negative"),
    notes: zod_1.z
        .string()
        .trim()
        .optional()
        .or(zod_1.z.literal("")),
    customTerms: zod_1.z.array(zod_1.z.string().trim().max(2000, "Custom term cannot exceed 2000 characters")),
    salesPersonName: zod_1.z
        .string()
        .trim()
        .min(1, "Sales person name is required"),
    items: zod_1.z
        .array(exports.quotationItemSchema)
        .min(1, "At least one item is required"),
});
exports.createQuotationBodySchema = baseQuotationBodySchema.superRefine((data, ctx) => {
    const quotationDate = new Date(data.quotationDate);
    const validTill = new Date(data.validTill);
    if (validTill < quotationDate) {
        ctx.addIssue({
            code: "custom",
            path: ["validTill"],
            message: "Valid till date cannot be earlier than quotation date",
        });
    }
});
const updateQuotationBodySchema = baseQuotationBodySchema
    .partial()
    .superRefine((data, ctx) => {
    if (data.quotationDate && data.validTill) {
        const quotationDate = new Date(data.quotationDate);
        const validTill = new Date(data.validTill);
        if (validTill < quotationDate) {
            ctx.addIssue({
                code: "custom",
                path: ["validTill"],
                message: "Valid till date cannot be earlier than quotation date",
            });
        }
    }
});
const quotationIdParamsSchema = zod_1.z.object({
    id: zod_1.z.uuid("Invalid quotation ID"),
});
exports.getAllQuotationsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
exports.quotationValidation = {
    createQuotation: zod_1.z.object({
        body: exports.createQuotationBodySchema,
    }),
    updateQuotation: zod_1.z.object({
        params: quotationIdParamsSchema,
        body: updateQuotationBodySchema,
    }),
    getQuotationById: zod_1.z.object({
        params: quotationIdParamsSchema,
    }),
    deleteQuotation: zod_1.z.object({
        params: quotationIdParamsSchema,
    }),
    getAllQuotations: zod_1.z.object({
        query: exports.getAllQuotationsQuerySchema,
    }),
};
