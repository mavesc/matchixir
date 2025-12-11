# Changelog

All notable changes to this project will be documented in this file.

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
