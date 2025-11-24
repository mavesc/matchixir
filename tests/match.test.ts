import { match, _ } from "../src/match";

describe("matchixir - matches()", () => {

    test("matches primitives exactly", () => {
        expect(
            match(5).with(5, () => true).none(() => false)
        ).toBe(true);

        expect(
            match("hello").with("hello", () => true).none(() => false)
        ).toBe(true);

        expect(
            match(true).with(true, () => true).none(() => false)
        ).toBe(true);
    });

    test("does not match incorrect primitives", () => {
        expect(
            match(5).with(4, () => true).none(() => false)
        ).toBe(false);

        expect(
            match("a").with("b", () => true).none(() => false)
        ).toBe(false);
    });

    test("wildcard always matches", () => {
        expect(
            match(999).with(_, () => "hit").none(() => "miss")
        ).toBe("hit");
    });

    test("matches shallow objects with partial patterns", () => {
        const value = { a: 1, b: 2 };

        expect(
            match(value).with({ a: 1 }, () => true).none(() => false)
        ).toBe(true);
    });

    test("matches deep nested objects recursively", () => {
        const value = {
            user: {
                id: "123",
                profile: {
                    age: 22,
                    country: "BO"
                }
            }
        };

        expect(
            match(value).with(
                { user: { profile: { age: 22 } } },
                () => "ok"
            ).none(() => "fail")
        ).toBe("ok");
    });

    test("matches arrays structurally", () => {
        expect(
            match([1, 2, 3]).with([1, 2, 3], () => "ok").none(() => "no")
        ).toBe("ok");

        expect(
            match([1, 2, 3]).with([1, _, 3], () => "ok").none(() => "no")
        ).toBe("ok");
    });

    test("array mismatched length fails", () => {
        expect(
            match([1, 2]).with([1, 2, 3], () => true).none(() => false)
        ).toBe(false);
    });

    test("matches tagged unions by subtype", () => {
        type R =
            | { status: "ok"; data: number }
            | { status: "error"; message: string };

        const success: R = { status: "ok", data: 999 };

        expect(
            match(success)
                .with({ status: "ok" }, v => v.data)
                .none(() => 0)
        ).toBe(999);
    });

    test("multiple .with branches resolve in order", () => {
        expect(
            match(10)
                .with(5, () => "no")
                .with(10, () => "yes")
                .with(_, () => "no")
                .none(() => "no")
        ).toBe("yes");
    });

    test("resolved branch prevents further matches", () => {
        let calls = 0;

        const result = match(10)
            .with(10, () => { calls++; return "hit"; })
            .with(_, () => { calls++; return "wrong"; })
            .none(() => { calls++; return "wrong"; });

        expect(result).toBe("hit");
        expect(calls).toBe(1);
    });

    test(".when works with predicates", () => {
        expect(
            match(42)
                .when(x => x > 40, () => "big")
                .none(() => "small")
        ).toBe("big");

        expect(
            match(10)
                .when(x => x > 40, () => "big")
                .none(() => "small")
        ).toBe("small");
    });

    test(".when is ignored after resolution", () => {
        let calls = 0;

        const result = match(50)
            .with(50, () => { calls++; return "matched"; })
            .when(x => x > 0, () => { calls++; return "wrong"; })
            .none(() => { calls++; return "wrong"; });

        expect(result).toBe("matched");
        expect(calls).toBe(1);
    });

    test("none acts like else", () => {
        expect(
            match("x").with("y", () => "no").none(() => "yes")
        ).toBe("yes");
    });

    test("object deep wildcard match", () => {
        const v = { user: { id: 1, data: { age: 20 } } };

        const result = match(v)
            .with({ user: { data: _ } }, () => "hit")
            .none(() => "miss");

        expect(result).toBe("hit");
    });

});
