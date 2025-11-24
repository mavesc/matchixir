# Examples

## Index

- [API response handling](#api-response-handling)
- [Event driven systems](#event-driven-systems)
- [File size checker](#file-size-checker)
- [Nested objects matching](#nested-objects-matching)
- [Error handling](#error-handling)
- [Auth with permissions](#auth-with-permissions)
- [Arrays](#arrays)

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