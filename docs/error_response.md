# Backend Error Response Format

Every error returned by this backend — regardless of where it originates
(validation, authentication, database, an unexpected crash, etc.) — is
normalized by a single global error handler
(`src/common/middleware/errorHandler.ts`) into **one consistent JSON shape**.

The frontend can therefore rely on the same structure for every failed
request and never has to guess.

---

## Standard error response shape

```json
{
  "success": false,
  "message": "Description is too long.",
  "error": {
    "code": "VALIDATION_ERROR",
    "statusCode": 422,
    "details": [
      {
        "field": "description",
        "message": "Description must be less than 5000 characters."
      }
    ]
  }
}
```

When there are no field-level errors, the shape is still consistent — `details`
is simply omitted:

```json
{
  "success": false,
  "message": "Something went wrong. Please try again.",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "statusCode": 500
  }
}
```

### Field reference

| Field                 | Type      | Always present | Meaning                                                                             |
| --------------------- | --------- | -------------- | ----------------------------------------------------------------------------------- |
| `success`             | `boolean` | Yes            | Always `false` for errors. `true` for successful responses.                         |
| `message`             | `string`  | Yes            | Human-readable message safe to show directly to the user (toast, popup, form).      |
| `error.code`          | `string`  | Yes            | Stable, machine-readable error code (e.g. `VALIDATION_ERROR`). Safe for `switch`.   |
| `error.statusCode`    | `number`  | Yes            | The HTTP status code, mirrored in the body for convenience.                         |
| `error.details`       | `array`   | No             | Field-level errors: `[{ "field": string, "message": string }]`. Present only when applicable. |
| `error.stack`         | `string`  | No             | Stack trace. **Development only** — never included when `NODE_ENV=production`.       |

> Note: the top-level `success` / `message` / `error` object is the stable
> contract. Do not depend on `error.stack` — it is a development-only debugging aid.

---

## HTTP status codes & error codes

| Scenario                          | HTTP status | `error.code`                |
| --------------------------------- | ----------- | --------------------------- |
| Field / form validation failed    | `422`       | `VALIDATION_ERROR`          |
| Malformed JSON / bad request      | `400`       | `BAD_REQUEST`               |
| Value too long for a column       | `400`       | `VALUE_TOO_LONG`            |
| Missing required DB value         | `400`       | `NULL_CONSTRAINT`           |
| Foreign key violation             | `400`       | `FOREIGN_KEY_VIOLATION`     |
| Not authenticated                 | `401`       | `UNAUTHENTICATED`           |
| Expired auth token                | `401`       | `TOKEN_EXPIRED`             |
| Not allowed / forbidden           | `403`       | `FORBIDDEN`                 |
| Resource not found / bad route    | `404`       | `NOT_FOUND`                 |
| Duplicate / unique conflict       | `409`       | `DUPLICATE_ENTRY`           |
| Payload too large                 | `413`       | `PAYLOAD_TOO_LARGE`         |
| Database unavailable              | `503`       | `DATABASE_UNAVAILABLE`      |
| Unexpected database error         | `500`       | `DATABASE_ERROR`            |
| Any unhandled/unknown error       | `500`       | `INTERNAL_SERVER_ERROR`     |

---

## Example responses

### Validation error (422)

```json
{
  "success": false,
  "message": "items.0.description: Item description cannot exceed 100000 characters",
  "error": {
    "code": "VALIDATION_ERROR",
    "statusCode": 422,
    "details": [
      {
        "field": "items.0.description",
        "message": "Item description cannot exceed 100000 characters"
      }
    ]
  }
}
```

### Duplicate / conflict error (409)

```json
{
  "success": false,
  "message": "A record with this quotationNumber already exists",
  "error": {
    "code": "DUPLICATE_ENTRY",
    "statusCode": 409
  }
}
```

### Database error (500)

```json
{
  "success": false,
  "message": "A database error occurred",
  "error": {
    "code": "DATABASE_ERROR",
    "statusCode": 500
  }
}
```

### Authentication error (401)

```json
{
  "success": false,
  "message": "Your session has expired. Please log in again.",
  "error": {
    "code": "TOKEN_EXPIRED",
    "statusCode": 401
  }
}
```

### Not found error (404)

```json
{
  "success": false,
  "message": "Quotation not found",
  "error": {
    "code": "NOT_FOUND",
    "statusCode": 404
  }
}
```

### Internal server error (500)

```json
{
  "success": false,
  "message": "Something went wrong. Please try again.",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "statusCode": 500
  }
}
```

---

## How the frontend should read & display errors

**Rule 1 — always show `response.data.message` first.** It is human-readable
and safe to display in a toast, popup, or inline banner.

```js
const errorMessage =
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";
```

**Rule 2 — if `response.data.error.details` exists, show each field error next
to its form field.** This lets you highlight the exact input that failed.

```js
// Example with axios + a form
try {
  await api.post("/api/v1/quotations/createQuotations", payload);
} catch (error) {
  const data = error?.response?.data;

  // 1) Top-level message → toast / banner
  toast.error(data?.message || "Something went wrong. Please try again.");

  // 2) Field-level errors → attach to the matching form fields
  const details = data?.error?.details;
  if (Array.isArray(details)) {
    details.forEach(({ field, message }) => {
      setFieldError(field, message); // e.g. react-hook-form's setError
    });
  }
}
```

**Rule 3 — branch on `error.code`, not on `message`,** if you need specific UI
behavior (e.g. redirect to login on `UNAUTHENTICATED` / `TOKEN_EXPIRED`). The
`message` text may change; `code` is stable.

```js
const code = error?.response?.data?.error?.code;
if (code === "UNAUTHENTICATED" || code === "TOKEN_EXPIRED") {
  redirectToLogin();
}
```

---

## Notes for backend developers

- **Throw `AppError`** (`src/common/errors/AppError.ts`) for expected errors.
  Use the factories so status codes stay consistent:

  ```ts
  throw AppError.notFound("Quotation not found");
  throw AppError.conflict("Quotation number already exists");
  throw AppError.validation("Invalid input", [
    { field: "email", message: "Email is required" },
  ]);
  ```

- **Wrap async route handlers** with `catchAsync`
  (`src/common/utils/catchAsync.ts`) so rejected promises reach the global
  handler instead of hanging the request.

- **Do not hand-craft error JSON** in controllers. Throw an error and let the
  global handler format it — this keeps the frontend contract stable.

- Validation is handled by `validateRequest`, which forwards Zod errors to the
  global handler; they become `422 VALIDATION_ERROR` with field-level `details`.

- Unmatched routes are caught by the `notFound` middleware and returned as
  `404 NOT_FOUND`.

- `unhandledRejection` / `uncaughtException` are trapped in `src/server.ts`;
  the process logs the fault and restarts cleanly rather than dying silently.
