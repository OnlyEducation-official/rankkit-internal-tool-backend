import assert from "node:assert/strict";
import test from "node:test";
import {
  createQuotationBodySchema,
  QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH,
} from "./quotation.validation";

const validQuotation = (description: string) => ({
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

test("accepts a quotation item description at the configured boundary", () => {
  const description = "x".repeat(QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH);

  assert.equal(createQuotationBodySchema.safeParse(validQuotation(description)).success, true);
});

test("accepts representative HTML, line breaks, and emoji", () => {
  const description = "<p>First line</p>\n<p>Second line 😀</p>";

  const result = createQuotationBodySchema.safeParse(validQuotation(description));

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.items[0].description, description);
  }
});

test("rejects a quotation item description above the configured boundary", () => {
  const description = "x".repeat(QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH + 1);
  const result = createQuotationBodySchema.safeParse(validQuotation(description));

  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find(
      ({ path }) => path.join(".") === "items.0.description"
    );
    assert.equal(issue?.code, "too_big");
    assert.equal(
      "maximum" in (issue ?? {}) ? issue.maximum : undefined,
      QUOTATION_ITEM_DESCRIPTION_MAX_LENGTH
    );
  }
});
