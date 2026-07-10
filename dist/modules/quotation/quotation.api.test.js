"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const client_1 = require("@prisma/client");
const app_1 = __importDefault(require("../../app"));
const quotation_service_1 = require("./quotation.service");
let baseUrl = "";
let server;
const validQuotation = (overrides = {}) => ({
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
const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
    });
    return { status: response.status, body: await response.json() };
};
const postQuotation = (body) => request("/api/v1/quotations/createQuotations", {
    method: "POST",
    body: JSON.stringify(body),
});
const assertValidationError = (result, field, code) => {
    strict_1.default.equal(result.status, 422);
    strict_1.default.equal(result.body.success, false);
    strict_1.default.equal(result.body.message, "Validation failed");
    strict_1.default.equal(result.body.error.code, "VALIDATION_ERROR");
    strict_1.default.equal(result.body.error.statusCode, 422);
    strict_1.default.equal("stack" in result.body.error, false);
    strict_1.default.ok(Array.isArray(result.body.errors));
    const detail = result.body.errors?.find((item) => item.field === field);
    strict_1.default.equal(detail?.code, code);
    strict_1.default.ok(detail?.message);
    strict_1.default.deepEqual(result.body.error.details, result.body.errors);
};
(0, node_test_1.before)(async () => {
    await new Promise((resolve) => {
        server = app_1.default.listen(0, "127.0.0.1", () => {
            const address = server.address();
            baseUrl = `http://127.0.0.1:${address.port}`;
            resolve();
        });
    });
});
(0, node_test_1.beforeEach)(() => node_test_1.mock.restoreAll());
(0, node_test_1.after)(async () => {
    node_test_1.mock.restoreAll();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
(0, node_test_1.test)("POST returns a coded error for a missing required field", async () => {
    const payload = validQuotation();
    delete payload.companyName;
    assertValidationError(await postQuotation(payload), "companyName", "REQUIRED");
});
(0, node_test_1.test)("POST returns a coded error for an empty required string", async () => {
    assertValidationError(await postQuotation(validQuotation({ companyName: "" })), "companyName", "REQUIRED");
});
(0, node_test_1.test)("POST returns a coded error for an invalid field type", async () => {
    assertValidationError(await postQuotation(validQuotation({ discount: "zero" })), "discount", "INVALID_TYPE");
});
(0, node_test_1.test)("GET returns a coded error for an invalid enum value", async () => {
    const result = await request("/api/v1/quotations/getAllQuotations?sortOrder=sideways");
    assertValidationError(result, "sortOrder", "INVALID_ENUM");
});
(0, node_test_1.test)("POST returns a coded too-small error", async () => {
    assertValidationError(await postQuotation(validQuotation({ items: [] })), "items", "TOO_SMALL");
});
(0, node_test_1.test)("POST returns a coded too-long error", async () => {
    const items = [{ title: "x".repeat(201), description: "Valid", rate: 100 }];
    assertValidationError(await postQuotation(validQuotation({ items })), "items.0.title", "TOO_LONG");
});
(0, node_test_1.test)("POST returns all invalid fields in one response", async () => {
    const result = await postQuotation(validQuotation({ companyName: "", discount: "zero", items: [] }));
    assertValidationError(result, "companyName", "REQUIRED");
    strict_1.default.deepEqual(result.body.errors?.map(({ field }) => field), ["companyName", "discount", "items"]);
});
(0, node_test_1.test)("GET rejects an invalid quotation ID before the database", async () => {
    const result = await request("/api/v1/quotations/not-a-uuid");
    assertValidationError(result, "id", "INVALID_FORMAT");
});
(0, node_test_1.test)("POST converts a duplicate database constraint safely", async () => {
    node_test_1.mock.method(quotation_service_1.quotationService, "createQuotation", async () => {
        throw new client_1.Prisma.PrismaClientKnownRequestError("duplicate value", {
            code: "P2002",
            clientVersion: "test",
            meta: { target: ["quotationNumber"], database_error: "secret" },
        });
    });
    const result = await postQuotation(validQuotation());
    strict_1.default.equal(result.status, 409);
    strict_1.default.equal(result.body.success, false);
    strict_1.default.equal(result.body.error.code, "DUPLICATE_ENTRY");
    strict_1.default.equal(result.body.errors?.[0]?.field, "quotationNumber");
    strict_1.default.equal(result.body.errors?.[0]?.code, "DUPLICATE");
    strict_1.default.equal(JSON.stringify(result.body).includes("secret"), false);
    strict_1.default.equal("stack" in result.body.error, false);
});
(0, node_test_1.test)("POST accepts a valid long description through the real route", async () => {
    const description = "x".repeat(10000);
    let receivedDescription = "";
    node_test_1.mock.method(quotation_service_1.quotationService, "createQuotation", async (payload) => {
        receivedDescription = payload.items[0].description ?? "";
        return {};
    });
    const result = await postQuotation(validQuotation({
        items: [{ title: "Service", description, rate: 100 }],
    }));
    strict_1.default.equal(result.status, 201);
    strict_1.default.equal(result.body.success, true);
    strict_1.default.equal(result.body.message, "Quotation created successfully");
    strict_1.default.equal(receivedDescription, description);
});
(0, node_test_1.test)("POST preserves the existing successful create response", async () => {
    node_test_1.mock.method(quotation_service_1.quotationService, "createQuotation", async () => ({}));
    const result = await postQuotation(validQuotation());
    strict_1.default.equal(result.status, 201);
    strict_1.default.equal(result.body.success, true);
    strict_1.default.equal(result.body.message, "Quotation created successfully");
    strict_1.default.equal(result.body.meta.action, "CREATE_QUOTATION");
});
(0, node_test_1.test)("PATCH preserves the existing successful update response", async () => {
    const id = "2c1a21d7-2c03-4a3e-90f0-95a63f663f17";
    node_test_1.mock.method(quotation_service_1.quotationService, "updateQuotationService", async () => ({ id }));
    const result = await request(`/api/v1/quotations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: "Updated" }),
    });
    strict_1.default.equal(result.status, 200);
    strict_1.default.equal(result.body.success, true);
    strict_1.default.equal(result.body.message, "Quotation updated successfully");
    strict_1.default.equal(result.body.data.id, id);
});
(0, node_test_1.test)("POST converts an unexpected error to a safe 500 response", async () => {
    node_test_1.mock.method(quotation_service_1.quotationService, "createQuotation", async () => {
        throw new Error("database password is secret");
    });
    const result = await postQuotation(validQuotation());
    strict_1.default.equal(result.status, 500);
    strict_1.default.equal(result.body.success, false);
    strict_1.default.equal(result.body.message, "Something went wrong. Please try again.");
    strict_1.default.equal(result.body.error.code, "INTERNAL_SERVER_ERROR");
    strict_1.default.equal("stack" in result.body.error, false);
    strict_1.default.equal(JSON.stringify(result.body).includes("password"), false);
    strict_1.default.equal(JSON.stringify(result.body).includes("secret"), false);
});
(0, node_test_1.test)("POST returns 400 for malformed JSON", async () => {
    const result = await request("/api/v1/quotations/createQuotations", {
        method: "POST",
        body: "{broken-json",
    });
    strict_1.default.equal(result.status, 400);
    strict_1.default.equal(result.body.message, "Malformed JSON request body");
    strict_1.default.equal(result.body.error.code, "BAD_REQUEST");
    strict_1.default.equal("stack" in result.body.error, false);
});
(0, node_test_1.test)("POST returns 413 when the request body exceeds the configured limit", async () => {
    const result = await request("/api/v1/quotations/createQuotations", {
        method: "POST",
        body: JSON.stringify({ data: "x".repeat(10 * 1024 * 1024) }),
    });
    strict_1.default.equal(result.status, 413);
    strict_1.default.equal(result.body.success, false);
    strict_1.default.equal(result.body.message, "Request payload is too large");
    strict_1.default.equal(result.body.error.code, "PAYLOAD_TOO_LARGE");
    strict_1.default.equal("stack" in result.body.error, false);
});
