![npm](https://img.shields.io/npm/v/matchixir)
![downloads](https://img.shields.io/npm/dm/matchixir)
![license](https://img.shields.io/badge/license-MIT-blue.svg)
![ts](https://img.shields.io/badge/TypeScript-declarations-blue)

# matchixir

A tiny pattern-matching DSL for TypeScript inspired by Elixir’s elegant `when`/`with` semantics.

`matchixir` aims to bring expressive, declarative, and functional matching to everyday JavaScript/TypeScript without macros or compilers.

This library focuses on clarity, safety, and extensibility. Future versions may introduce more Elixir-like features such as guards, nested destructuring, pinned variables, or match-fail errors.

## Index

- [Installation](#installation)
- [Basic usage](#basic-usage)
- [API overview](#api-overview)
- [Advanced usage](#advanced-usage)
- [Async matching](#async-matching)
- [Design goals](#design-goals)
- [Versioning](#versioning)
- [Contributing](#contributing)
- [License](#license)
- [Documentation](#documentation)
- [Changelog](#changelog)
- [Credits](#credits)

---

## Installation

```bash
npm install matchixir
```

## Basic usage

The core API mirrors the spirit of Elixir’s pattern matching while remaining unintrusive in TypeScript.

```typescript
import { match } from "matchixir";

const value = 42;
const result = match(value)
    .with(0, () => "zero")
    .with(1, () => "one")
    .when(x => x > 10, x => large: ${x})
    .none(() => "other");

console.log(result); // "large: 42"
```

## API overview

`matchixir` exposes a single function:
```typescript
match<T>(pattern: T) => Matcher<T>
```

The `Matcher` instance supports the following chainable methods:

### .with(pattern, callback)

Strict matching using` ===`.
Equivalent to Elixir’s case pattern equality.

```typescript
match(value)
    .with(10, v => ...)
    .with("ok", v => ...)
```

Use this for literal matches.

When matching a discriminated union, the callback argument is **narrowed** to the
variant the pattern selected:

```typescript
type Result =
    | { status: "ok"; data: number }
    | { status: "error"; message: string };

match(result)
    .with({ status: "ok" }, v => v.data)       // v is the "ok" variant
    .with({ status: "error" }, v => v.message) // v is the "error" variant
    .none(() => 0);
```

### .when(predicate, callback)

Predicate-based matching.
Executes only if the internal value has not been matched before.


```typescript
match(value)
    .when(x => x % 2 === 0, x => "even")
```

Useful for conditions, guards, and expressive logic. If the predicate is a
TypeScript type guard, the callback argument is narrowed to the guarded type:

```typescript
const isOk = (r: Result): r is Extract<Result, { status: "ok" }> =>
    r.status === "ok";

match(result)
    .when(isOk, v => v.data) // v is the "ok" variant
    .none(() => 0);
```

### .none(callback)

Returns the fallback value when no .with or .when matched.

```typescript
const result = match(value)
    .with("admin", () => ...)
    .when(isValidUser, () => ...)
    .none(() => "guest");
```
> [!IMPORTANT]
> This finalizes the chain and it's use is recommended. The `none` finalizer returns the value contained within `Matcher<T>` — hence it makes the library fully expressive.

## Advanced usage

Below are the cases TypeScript users find most useful when mirroring Elixir.

### Matching objects (structural match)

`matchixir` supports structural object matching using shallow comparison.

Keys must exist and match strictly.

```typescript
match(user)
    .with({ role: "admin" }, u => ...)
    .with({ active: false }, u => ...)
    .none(u => ...)
```

### Matching arrays

```typescript
match(list)
    .with([], () => "empty")
    .when(arr => arr.length === 1, arr => single: ${arr[0]})
    .when(arr => arr.length > 1, arr => many: ${arr.length})
    .none(() => "unknown");
```

For deep array matching, use `.when`.

### Combined matching

You can chain literal, structural, and predicate-based matches freely.

```typescript
match(input)
    .with(null, () => "none")
    .with({ tag: "ok" }, x => x.value)
    .when(x => typeof x === "string", x => x.toUpperCase())
    .when(Array.isArray, arr => arr.join(","))
    .none(() => "fallback");
```

### Type narrowing & result types

`matchixir` is fully type-aware:

- **Argument narrowing** — `.with(pattern, cb)` narrows `cb`'s argument to the
  variant the pattern selects; `.when(guard, cb)` narrows it to the guarded type.
  The `_` wildcard and non-matching patterns leave the argument as the full type
  (never `never`).
- **Result accumulation** — the value returned by `.none()` is the union of every
  branch's return type, so the compiler knows all possible outcomes of the match:

```typescript
const out = match(result)
    .with({ status: "ok" }, v => v.data)       // number
    .with({ status: "error" }, v => v.message) // string
    .none(() => null);                         // null

// out: number | string | null
```

## Async Matching
`matchixir` supports asynchronous branches automatically.
If any `with()` or `when()` callback returns a `Promise`, the matcher becomes asynchronous and must be awaited.
```typescript
const result = await match(value)
  .with({ type: "load" }, async () => {
     await wait(300);
     return "loaded";
  })
  .with({ type: "sync" }, () => "fast")
  .none(() => "fallback");
```

- If all branches are synchronous → the matcher behaves synchronously.
- If any branch returns a Promise → the matcher becomes async.
- Synchronous code remains fully supported.

This allows you to write expressive matching logic even when performing I/O, network requests, or long-running operations.

## Design goals

- Provide ergonomic pattern matching similar to Elixir.
- Remain zero-dependency.
- Maintain pure functions and referential transparency.
- Allow progressive feature growth (guards, deep matching, pin operator, etc.)

## Versioning

`matchixir` follows semantic versioning.
All breaking changes are reserved for major releases.

Every release is documented in `CHANGELOG.md`.

## Contributing

Contributions are welcome.  

This library is intentionally small and expressive. Keep contributions simple and Elixir-like.

## License

MIT License.  
See: [LICENSE](./LICENSE)

## Documentation

Extended documentation lives in:  
[docs/](./docs)

## Changelog

See: [CHANGELOG.md](./CHANGELOG.md)

## Credits

Author: **Mauricio Vargas Escobar**  
"**Forging an FPer world**"