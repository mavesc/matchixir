# Examples

## Index

- [API response handling](#api-response-handling)
- [Event driven systems](#event-driven-systems)
- [File size checker](#file-size-checker)
- [Nested objects matching](#nested-objects-matching)
- [Error handling](#error-handling)
- [Auth with permissions](#auth-with-permissions)
- [Arrays](#arrays)
- [Bank payment system](#bank-payment-system)

### Api response handling

```typescript
import { match, _ } from "matchixir";

type ApiResponse =
    | { status: "ok"; data: { id: string; balance: number } }
    | { status: "error"; code: number; message: string };

export function handleResponse(res: ApiResponse) {
    return match(res)
        .with({ status: "ok", data: { id: _, balance: _ } }, ({ data }) => `User ${data.id} has $${data.balance} USD`)
        .with({ status: "error", code: 404 }, () => "Resource not found!")
        .with({ status: "error", code: _ }, ({ message }) => `Server error: ${message}`)
        .none(() => "Unknown response");
}

console.log(handleResponse({ status: "ok", data: { id: "123", balance: 100 } }));
console.log(handleResponse({ status: "error", code: 404, message: "Resource not found" }));
console.log(handleResponse({ status: "error", code: 500, message: "Server error" }));
console.log(handleResponse({ something: "weird" }));

```

### Event driven systems:
```typescript
import { match, _ } from "matchixir";

type Event =
    | { type: "USER_CREATED"; userId: string }
    | { type: "USER_DELETED"; reason: string }
    | { type: "PING" };

export function handleEvent(event: Event) {
    return match(event)
        .with({ type: "USER_CREATED", userId: _ }, ({ userId }) => `New user: ${userId}`)
        .with({ type: "USER_DELETED", reason: _ }, ({ reason }) => `User removed because: ${reason}`)
        .with({ type: "PING" }, () => "pong")
        .none(() => "Unknown event");
}

console.log(handleEvent({ type: "USER_CREATED", userId: "123" }));
console.log(handleEvent({ type: "USER_DELETED", reason: "user left" }));
console.log(handleEvent({ type: "PING" }));
console.log(handleEvent({ something: "weird" }));
```

### File size checker:

```typescript
import { match } from "matchixir";

const file = { name: "report.pdf", size: 19302 };

const sizeCategory = match(file)
    .when(f => f.size < 10_000, f => `${f.name} is small`)
    .when(f => f.size >= 10_000 && f.size < 100_000, f => `${f.name} is medium`)
    .when(f => f.size >= 100_000, f => `${f.name} is large`)
    .none(f => `${f.name} size unknown`);

console.log(sizeCategory); // "report.pdf is medium"
```

### Nested objects matching:

```typescript
import { match, _ } from "matchixir";

const file = {
    name: "report.pdf",
    meta: {
        owner: "Mauricio",
        size: 19302,
        permissions: ["read", "write"],
    },
};

const result = match(file)
    .with({ meta: { permissions: ["read", "write"] } }, () => "Full access")
    .with({ meta: { permissions: ["read"] } }, () => "Read-only")
    .none(() => "Unknown permissions");

console.log(result); // "Full access"

```

### Error handling:

```typescript
import { match, _ } from "matchixir";

type ErrorType = { code: string; message: string };

function formatError(err: ErrorType) {
    return match(err)
        .with({ code: "ENOENT" }, ({ message }) => message)
        .with({ code: _, message: _ }, e => `Error ${e.code}: ${e.message}`)
        .none(() => "Unknown error.");
}

console.log(formatError({ code: "ENOENT", message: "File not found" }));
console.log(formatError({ code: "EEXIST", message: "File already exists" }));
```

### Auth with permissions:

```typescript
import { match } from "matchixir";

const user = { name: "Mauricio", role: "admin" };

const access = match(user)
    .when(u => u.role === "admin", () => "full access")
    .when(u => u.role === "moderator", () => "limited access")
    .when(u => u.role === "guest", () => "read-only")
    .none(() => "no access");

console.log(access); // "full access"
```

### Arrays:

```typescript
import { match, _ } from "matchixir";

const items = [
    { id: 1, type: "fruit", name: "apple" },
    { id: 2, type: "tool", name: "hammer" },
];

const tool = items.find(item =>
    match(item)
        .with({ type: "tool" }, () => true)
        .none(() => false)
);

const bird = items.find(item =>
    match(item)
        .with({ type: "bird" }, () => true)
        .none(() => false)
);

console.log(tool); // { id: 2, type: 'tool', name: 'hammer' }
console.log(bird); // undefined
```

### Bank payment system:

```typescript
import { match, _ } from "matchixir";

type PaymentEvent =
    | {
        type: "payment_initiated";
        user: { id: string; tier: "basic" | "premium" | "enterprise" };
        payload: { amount: number; currency: string };
    }
    | {
        type: "payment_completed";
        transaction: {
            id: string;
            method: "card" | "pix" | "bank_transfer";
            details: { cardLast4?: string; bankCode?: string };
        };
        meta?: { retries: number };
    }
    | {
        type: "payment_failed";
        reason: { code: "INSUFFICIENT_FUNDS" | "FRAUD" | "BANK_DOWN" };
        attempts: number;
    }
    | {
        type: "batch_reconciliation";
        results: Array<{ id: string; status: "ok" | "discrepancy" }>;
        generatedAt: string;
    };

export function processPaymentEvent(ev: PaymentEvent) {
    return match(ev)
        .with(
            {
                type: "payment_initiated",
                user: { tier: "enterprise" },
            },
            (x) =>
                `Enterprise user ${x.user.id} initiated a payment of ${x.payload.amount} ${x.payload.currency}`
        )
        .with(
            {
                type: "payment_completed",
                transaction: { method: "card", details: { cardLast4: _ } },
            },
            (x) =>
                `Card payment completed (txn ${x.transaction.id}), card ending in ${x.transaction.details.cardLast4}`
        )
        .with(
            {
                type: "payment_completed",
                transaction: { method: "bank_transfer", details: { bankCode: _ } },
            },
            (x) =>
                `Bank transfer completed (txn ${x.transaction.id}), bank code ${x.transaction.details.bankCode}`
        )
        .with(
            {
                type: "payment_failed",
                reason: { code: "INSUFFICIENT_FUNDS" },
            },
            (x) =>
                `Payment failed due to insufficient funds. Attempts: ${x.attempts}`
        )
        .with(
            {
                type: "batch_reconciliation",
                results: _,
            },
            (x) => {
                const discrepancies = x.results.filter(
                    (r) => r.status === "discrepancy"
                );
                return `Batch reconciliation completed. Discrepancies found: ${discrepancies.length}`;
            }
        )
        .when(
            (e) =>
                e.type === "payment_failed" &&
                e.reason.code === "FRAUD" &&
                e.attempts > 1,
            (x) =>
                `FRAUD ALERT on repeated attempts (${x.attempts} attempts)`
        )
        .none(() => "Unknown or unhandled event");
}


console.log(
    processPaymentEvent({
        type: "payment_completed",
        transaction: {
            id: "T-992",
            method: "card",
            details: { cardLast4: "3812" },
        },
    })
); // Card payment completed (txn T-992), card ending in 3812

console.log(
    processPaymentEvent({
        type: "batch_reconciliation",
        results: [
            { id: "t1", status: "ok" },
            { id: "t2", status: "discrepancy" },
            { id: "t3", status: "discrepancy" },
        ],
        generatedAt: "2025-01-03T01:00:00Z",
    })
); // Batch reconciliation completed. Discrepancies found: 2

console.log(
    processPaymentEvent({
        type: "payment_failed",
        reason: { code: "FRAUD" },
        attempts: 4,
    })
); // FRAUD ALERT on repeated attempts (4 attempts)
```