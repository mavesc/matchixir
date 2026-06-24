import { match, _ } from "../src/match";

/**
 * Compile-time assertions. These tests carry no runtime expectations beyond a
 * trivial value check — their real purpose is that ts-jest type-checks this
 * file, so a regression in narrowing or result-type accumulation makes the
 * suite fail to compile.
 */

type Equal<A, B> =
    (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;

function expectType<T>(_value: T): void { /* type-position assertion only */ }
function assertTrue<_T extends true>(): void { /* compile-time guard */ }

type Result =
    | { status: "ok"; data: number }
    | { status: "error"; message: string }
    | { status: "pending" };

// Identity that fixes the static type to the full union. A direct
// `const x: Result = { status: "ok", ... }` would be narrowed by const-literal
// analysis to a single variant, defeating the point of these tests.
const asResult = (r: Result): Result => r;

describe("matchixir - type narrowing", () => {
    test(".with narrows the callback argument to the matched variant", () => {
        const out = match(asResult({ status: "ok", data: 999 }))
            .with({ status: "ok" }, v => {
                // v is narrowed to the "ok" variant — `data` is reachable.
                expectType<number>(v.data);
                // @ts-expect-error `message` does not exist on the "ok" variant.
                v.message;
                return v.data;
            })
            .with({ status: "error" }, v => {
                expectType<string>(v.message);
                // @ts-expect-error `data` does not exist on the "error" variant.
                v.data;
                return v.message.length;
            })
            .none(() => -1);

        expect(out).toBe(999);
    });

    test(".none accumulates the union of every branch's return type", () => {
        const out = match(asResult({ status: "pending" }))
            .with({ status: "ok" }, v => v.data)        // number
            .with({ status: "error" }, v => v.message)  // string
            .none(() => null);                          // null

        assertTrue<Equal<typeof out, number | string | null>>();
        expect(out).toBeNull();
    });

    test(".none callback receives the full, un-narrowed type", () => {
        const out = match(asResult({ status: "ok", data: 1 }))
            .with({ status: "error" }, v => v.message)
            .none(v => {
                assertTrue<Equal<typeof v, Result>>();
                return v.status;
            });

        expect(out).toBe("ok");
    });

    test("the wildcard does not narrow — the callback keeps the full type", () => {
        const out = match(asResult({ status: "ok", data: 1 }))
            .with(_, v => {
                assertTrue<Equal<typeof v, Result>>();
                return v.status;
            })
            .none(() => "none" as const);

        expect(out).toBe("ok");
    });

    test(".when with a type guard narrows the callback argument", () => {
        type OkVariant = Extract<Result, { status: "ok" }>;
        const isOk = (r: Result): r is OkVariant => r.status === "ok";

        const out = match(asResult({ status: "ok", data: 42 }))
            .when(isOk, v => {
                expectType<number>(v.data);
                return v.data;
            })
            .none(() => 0);

        expect(out).toBe(42);
    });

    test("async branch surfaces a Promise in the accumulated result type", async () => {
        const out = match(asResult({ status: "ok", data: 7 }))
            .with({ status: "ok" }, async v => v.data)  // Promise<number>
            .none(() => 0);                             // number

        // Any async branch makes the chain awaitable; awaiting flattens the union.
        const settled = await out;
        assertTrue<Equal<typeof settled, number>>();
        expect(settled).toBe(7);
    });
});
