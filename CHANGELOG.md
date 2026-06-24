# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-06-24
### Added
- **Type narrowing for `.with` callbacks.** The callback argument is now narrowed
  to the variant selected by the pattern, so matching `{ status: "ok" }` on a
  discriminated union gives the callback the `"ok"` member — its variant-specific
  fields are reachable and type-checked. Non-matching patterns and the `_`
  wildcard fall back to the full type (never `never`).
- **Result-type accumulation.** `Matcher<T, R>` now tracks the return type of
  every resolved branch, so `.none()` reports the true union of all possible
  results instead of only the fallback callback's type.
- **Type-guard support in `.when`.** A predicate written as a TypeScript type
  guard (`(v) => v is S`) narrows the callback argument to `S`.

### Changed
- The `_` wildcard is now typed as a unique symbol (was `any`), and `Pattern<T>`
  is a recursive structural type. This is what enables literal discriminants to
  survive inference. Runtime behaviour is unchanged.

### Notes
- Backwards compatible at runtime — all existing matchers behave identically.
- Pattern types are now stricter: code that previously type-checked only because
  patterns were `any` (e.g. unknown keys or mismatched literals) may surface new,
  correct type errors. These reflect real pattern mistakes; the runtime is
  unaffected.

## [1.1.0] - 2025-12-11
### Added
- **Asynchronous pattern matching support.**
  - `with()`, `when()`, and `none()` now detect and propagate Promises returned from callbacks.
  - If any matched branch is asynchronous, `none()` returns a `Promise` and must be awaited.
  - Synchronous behavior is fully preserved for non-Promise callbacks.

### Notes
- This update is backwards compatible.
- Existing synchronous matchers continue to work without modification.
- Async support allows cleaner control flow for operations such as I/O, database queries, and filesystem/video processing workflows.


## [1.0.0] - 2025-11-24
### Added
- Initial release of matchixir.
- `match()` core function.
- `with()` value-based matching.
- `when()` predicate-based matching.
- `default()` fallback clause.
- Fluent matcher chain.
- Type-safe generics.
- Full README with examples and documentation structure.
- MIT license.
- Project metadata and structure.

### Notes
- This release establishes the foundational matching DSL.
- Structural object matching may be introduced in future minor versions.
