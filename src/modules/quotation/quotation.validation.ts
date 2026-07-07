import { z } from "zod";

const quotationItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Item title is required")
    .max(200, "Item title cannot exceed 200 characters"),

  description: z
    .string()
    .trim()
    // Quotation item descriptions can be long. Keep a generous upper bound
    // (aligned with the 10mb body limit) so real content is never truncated,
    // while still guarding against unbounded/abusive input.
    .max(100000, "Item description cannot exceed 100000 characters")
    .optional()
    .or(z.literal("")),

  rate: z
    .number({ error: "Rate must be a number" })
    .min(0, "Rate cannot be negative"),
});

const baseQuotationBodySchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required"),

  companyAddress: z
    .string()
    .trim()
    .min(1, "Company address is required"),

  companyPhone: z
    .string()
    .trim()
    .min(1, "Company phone is required"),

  companyEmail: z.email("Invalid company email"),

  clientName: z
    .string()
    .trim()
    .min(1, "Client name is required"),

  clientAddress: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  clientPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  companyType: z
    .string()
    .trim()
    .min(1, "Company Type required."),

  clientEmail: z
    .email("Invalid client email")
    .trim()
    .optional()
    .or(z.literal("")),

  quotationDate: z.iso.date("Quotation date must be in YYYY-MM-DD format"),
  validTill: z.iso.date("Valid till date must be in YYYY-MM-DD format"),

  discount: z
    .number({ error: "Discount must be a number" })
    .min(0, "Discount cannot be negative"),

  grandTotal: z
    .number({ error: "Grand total must be a number" })
    .min(0, "Grand total cannot be negative"),

  notes: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  customTerms: z.array(
    z.string().trim().max(2000, "Custom term cannot exceed 2000 characters")
  ),

  salesPersonName: z
    .string()
    .trim()
    .min(1, "Sales person name is required"),

  items: z
    .array(quotationItemSchema)
    .min(1, "At least one item is required"),
});

const createQuotationBodySchema = baseQuotationBodySchema.superRefine((data, ctx) => {
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

const quotationIdParamsSchema = z.object({
  id: z.string(),
});


export const getAllQuotationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const quotationValidation = {
  createQuotation: z.object({
    body: createQuotationBodySchema,
  }),

  updateQuotation: z.object({
    params: quotationIdParamsSchema,
    body: updateQuotationBodySchema,
  }),

  getQuotationById: z.object({
    params: quotationIdParamsSchema,
  }),

  deleteQuotation: z.object({
    params: quotationIdParamsSchema,
  }),

  getAllQuotations: z.object({
    query: getAllQuotationsQuerySchema,
  }),
};

export type TCreateQuotationBody = z.infer<typeof createQuotationBodySchema>;
export type TUpdateQuotationBody = z.infer<typeof updateQuotationBodySchema>;
export type TGetAllQuotationsQuery = z.infer<typeof getAllQuotationsQuerySchema>;