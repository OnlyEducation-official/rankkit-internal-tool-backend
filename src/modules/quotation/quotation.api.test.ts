import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, mock, test } from "node:test";
import { Prisma } from "@prisma/client";
import app from "../../app";
import { quotationService } from "./quotation.service";
import type { TCreateQuotationBody } from "./quotation.validation";

type ErrorDetail = { field: string; message: string; code: string };
type ErrorResponse = {
  success: false;
  message: string;
  errors?: ErrorDetail[];
  error: {
    code: string;
    statusCode: number;
    details?: ErrorDetail[];
    stack?: unknown;
  };
};

let baseUrl = "";
let server: ReturnType<typeof app.listen>;

const validQuotation = (overrides: Record<string, unknown> = {}) => ({
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
  items: [{ title: "Service", description: "Description", rate: 100 }],
  ...overrides,
});

const request = async (
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; body: any }> => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  return { status: response.status, body: await response.json() };
};

const postQuotation = (body: unknown) =>
  request("/api/v1/quotations/createQuotations", {
    method: "POST",
    body: JSON.stringify(body),
  });

const assertValidationError = (
  result: { status: number; body: ErrorResponse },
  field: string,
  code: string
) => {
  assert.equal(result.status, 422);
  assert.equal(result.body.success, false);
  assert.equal(result.body.message, "Validation failed");
  assert.equal(result.body.error.code, "VALIDATION_ERROR");
  assert.equal(result.body.error.statusCode, 422);
  assert.equal("stack" in result.body.error, false);
  assert.ok(Array.isArray(result.body.errors));

  const detail = result.body.errors?.find((item) => item.field === field);
  assert.equal(detail?.code, code);
  assert.ok(detail?.message);
  assert.deepEqual(result.body.error.details, result.body.errors);
};

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

beforeEach(() => mock.restoreAll());

after(async () => {
  mock.restoreAll();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

test("POST returns a coded error for a missing required field", async () => {
  const payload = validQuotation();
  delete (payload as { companyName?: unknown }).companyName;

  assertValidationError(await postQuotation(payload), "companyName", "REQUIRED");
});

test("POST returns a coded error for an empty required string", async () => {
  assertValidationError(
    await postQuotation(validQuotation({ companyName: "" })),
    "companyName",
    "REQUIRED"
  );
});

test("POST returns a coded error for an invalid field type", async () => {
  assertValidationError(
    await postQuotation(validQuotation({ discount: "zero" })),
    "discount",
    "INVALID_TYPE"
  );
});

test("GET returns a coded error for an invalid enum value", async () => {
  const result = await request(
    "/api/v1/quotations/getAllQuotations?sortOrder=sideways"
  );

  assertValidationError(result, "sortOrder", "INVALID_ENUM");
});

test("POST returns a coded too-small error", async () => {
  assertValidationError(
    await postQuotation(validQuotation({ items: [] })),
    "items",
    "TOO_SMALL"
  );
});

test("POST returns a coded too-long error", async () => {
  const items = [{ title: "x".repeat(201), description: "Valid", rate: 100 }];

  assertValidationError(
    await postQuotation(validQuotation({ items })),
    "items.0.title",
    "TOO_LONG"
  );
});

test("POST returns all invalid fields in one response", async () => {
  const result = await postQuotation(
    validQuotation({ companyName: "", discount: "zero", items: [] })
  );

  assertValidationError(result, "companyName", "REQUIRED");
  assert.deepEqual(
    result.body.errors?.map(({ field }: ErrorDetail) => field),
    ["companyName", "discount", "items"]
  );
});

test("GET rejects an invalid quotation ID before the database", async () => {
  const result = await request("/api/v1/quotations/not-a-uuid");

  assertValidationError(result, "id", "INVALID_FORMAT");
});

test("POST converts a duplicate database constraint safely", async () => {
  mock.method(quotationService, "createQuotation", async () => {
    throw new Prisma.PrismaClientKnownRequestError("duplicate value", {
      code: "P2002",
      clientVersion: "test",
      meta: { target: ["quotationNumber"], database_error: "secret" },
    });
  });

  const result = await postQuotation(validQuotation());

  assert.equal(result.status, 409);
  assert.equal(result.body.success, false);
  assert.equal(result.body.error.code, "DUPLICATE_ENTRY");
  assert.equal(result.body.errors?.[0]?.field, "quotationNumber");
  assert.equal(result.body.errors?.[0]?.code, "DUPLICATE");
  assert.equal(JSON.stringify(result.body).includes("secret"), false);
  assert.equal("stack" in result.body.error, false);
});

test("POST accepts a valid long description through the real route", async () => {
  const description = "x".repeat(10_000);
  let receivedDescription = "";
  mock.method(quotationService, "createQuotation", async (payload: TCreateQuotationBody) => {
    receivedDescription = payload.items[0].description ?? "";
    return {} as never;
  });

  const result = await postQuotation(
    validQuotation({
      items: [{ title: "Service", description, rate: 100 }],
    })
  );

  assert.equal(result.status, 201);
  assert.equal(result.body.success, true);
  assert.equal(result.body.message, "Quotation created successfully");
  assert.equal(receivedDescription, description);
});

test("POST preserves the existing successful create response", async () => {
  mock.method(quotationService, "createQuotation", async () => ({} as never));

  const result = await postQuotation(validQuotation());

  assert.equal(result.status, 201);
  assert.equal(result.body.success, true);
  assert.equal(result.body.message, "Quotation created successfully");
  assert.equal(result.body.meta.action, "CREATE_QUOTATION");
});

test("PATCH preserves the existing successful update response", async () => {
  const id = "2c1a21d7-2c03-4a3e-90f0-95a63f663f17";
  mock.method(
    quotationService,
    "updateQuotationService",
    async () => ({ id } as never)
  );

  const result = await request(`/api/v1/quotations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ notes: "Updated" }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.message, "Quotation updated successfully");
  assert.equal(result.body.data.id, id);
});

test("POST converts an unexpected error to a safe 500 response", async () => {
  mock.method(quotationService, "createQuotation", async () => {
    throw new Error("database password is secret");
  });

  const result = await postQuotation(validQuotation());

  assert.equal(result.status, 500);
  assert.equal(result.body.success, false);
  assert.equal(result.body.message, "Something went wrong. Please try again.");
  assert.equal(result.body.error.code, "INTERNAL_SERVER_ERROR");
  assert.equal("stack" in result.body.error, false);
  assert.equal(JSON.stringify(result.body).includes("password"), false);
  assert.equal(JSON.stringify(result.body).includes("secret"), false);
});

test("POST returns 400 for malformed JSON", async () => {
  const result = await request("/api/v1/quotations/createQuotations", {
    method: "POST",
    body: "{broken-json",
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.message, "Malformed JSON request body");
  assert.equal(result.body.error.code, "BAD_REQUEST");
  assert.equal("stack" in result.body.error, false);
});

test("POST returns 413 when the request body exceeds the configured limit", async () => {
  const result = await request("/api/v1/quotations/createQuotations", {
    method: "POST",
    body: JSON.stringify({ data: "x".repeat(10 * 1024 * 1024) }),
  });

  assert.equal(result.status, 413);
  assert.equal(result.body.success, false);
  assert.equal(result.body.message, "Request payload is too large");
  assert.equal(result.body.error.code, "PAYLOAD_TOO_LARGE");
  assert.equal("stack" in result.body.error, false);
});
