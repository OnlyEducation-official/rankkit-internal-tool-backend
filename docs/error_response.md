# Backend error response contract

Every failed request is normalized by
`src/common/middleware/errorHandler.ts`. Controllers and repositories must
throw errors (or reject promises) instead of creating their own error JSON.

Successful response bodies are unchanged.

## Validation errors

Request validation failures use HTTP `422` and this response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "items.0.description",
      "message": "Item description cannot exceed 100000 characters",
      "code": "TOO_LONG"
    }
  ],
  "error": {
    "code": "VALIDATION_ERROR",
    "statusCode": 422,
    "details": [
      {
        "field": "items.0.description",
        "message": "Item description cannot exceed 100000 characters",
        "code": "TOO_LONG"
      }
    ]
  }
}
```

`errors` is the frontend-friendly field list. `error.details` contains the
same entries for compatibility with the existing quotation frontend. Field
paths use dot notation, including array indexes.

Known field codes include:

- `REQUIRED`
- `INVALID_TYPE`
- `INVALID_FORMAT`
- `INVALID_ENUM`
- `INVALID_VALUE`
- `TOO_SMALL`
- `TOO_LONG`
- `TOO_BIG`
- `UNKNOWN_FIELD`
- `DUPLICATE`

## Other errors

Errors without field details omit both `errors` and `error.details`:

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

| Scenario | HTTP status | `error.code` |
| --- | ---: | --- |
| Request validation | 422 | `VALIDATION_ERROR` |
| Malformed JSON | 400 | `BAD_REQUEST` |
| Not authenticated | 401 | `UNAUTHENTICATED` |
| Expired token | 401 | `TOKEN_EXPIRED` |
| Forbidden | 403 | `FORBIDDEN` |
| Not found | 404 | `NOT_FOUND` |
| Duplicate value | 409 | `DUPLICATE_ENTRY` |
| Payload too large | 413 | `PAYLOAD_TOO_LARGE` |
| Database unavailable | 503 | `DATABASE_UNAVAILABLE` |
| Unexpected error | 500 | `INTERNAL_SERVER_ERROR` |

Stack traces, rejected values, ORM messages, and database internals are never
included in API JSON. Unexpected technical errors are logged server-side.

## Frontend consumption

The existing frontend uses `fetch`, so it parses JSON even when `response.ok`
is false and throws a structured `BackendError`. It reads the main message and
the backward-compatible field list as follows:

```ts
const message = error.payload.message;
const fieldErrors = error.payload.error.details ?? [];
```

Show `message` in the existing toast/error UI. Map each detail's `field` and
`message` to its form input. Treat a missing details array as an empty array.
Use stable `error.code` or field `code` values for program logic, not message
text.

## Backend usage

Expected errors should use `AppError` factories:

```ts
throw AppError.notFound("Quotation not found");
throw AppError.validation("Validation failed", [
  { field: "companyName", message: "Company name is required", code: "REQUIRED" },
]);
```

All asynchronous controllers must use `catchAsync`, and `validateRequest`
must pass caught validation errors to `next(error)`. The global error handler
is the only component that sends error responses.
