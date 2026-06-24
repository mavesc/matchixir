declare const WILDCARD: unique symbol;

export const _ = Symbol("wildcard") as unknown as typeof WILDCARD;

type Wildcard = typeof _;

export type Pattern<T> =
    | Wildcard
    | (T extends readonly unknown[]
        ? { readonly [I in keyof T]: Pattern<T[I]> } | readonly Pattern<T[number]>[]
        : T extends object
        ? { [K in keyof T]?: Pattern<T[K]> }
        : T);

type IsAny<T> = 0 extends 1 & T ? true : false;

type Matches<V, P> =
    IsAny<P> extends true ? true
    : [P] extends [Wildcard] ? true
    : P extends readonly unknown[]
    ? (V extends readonly unknown[] ? true : false)
    : P extends object
    ? (V extends object
        ? ({ [K in keyof P]-?: K extends keyof V ? Matches<V[K], P[K]> : false }[keyof P] extends true ? true : false)
        : false)
    : ([V] extends [P] ? true : [P] extends [V] ? true : false);

type Select<T, P> = T extends unknown ? (Matches<T, P> extends true ? T : never) : never;

export type Narrow<T, P> =
    IsAny<P> extends true ? T
    : [P] extends [Wildcard] ? T
    : [Select<T, P>] extends [never] ? T
    : Select<T, P>;

export function match<T>(value: T): Matcher<T> {
    return new Matcher(value);
}

function matches(value: unknown, pattern: unknown): boolean {
    if (pattern === _) return true;

    if (Object.is(value, pattern)) return true;

    if (Array.isArray(pattern) && Array.isArray(value)) {
        if (pattern.length !== value.length) return false;
        return pattern.every((pVal, i) => matches(value[i], pVal));
    }

    if (isObject(value) && isObject(pattern)) {
        return Object.entries(pattern).every(([key, pVal]) => {
            const val = (value as Record<string, unknown>)[key];
            return matches(val, pVal);
        });
    }

    return false;
}

function isObject(val: unknown): val is Record<string, unknown> {
    return typeof val === "object" && val !== null;
}

export class Matcher<T, R = never> {
    private resolved = false;
    private value: T;
    private result: unknown;
    private isAsync = false;

    constructor(value: T) {
        this.value = value;
    }

    private handleCallback<F>(callback: (args: any) => F): void {
        const res = callback(this.value);
        if (res instanceof Promise) {
            this.isAsync = true;
        }
        this.result = res;
        this.resolved = true;
    }

    with<P extends Pattern<T>, F>(
        pattern: P,
        callback: (value: Narrow<T, P>) => F,
    ): Matcher<T, R | F> {
        if (!this.resolved && matches(this.value, pattern)) {
            this.handleCallback(callback);
        }
        return this as unknown as Matcher<T, R | F>;
    }

    when<S extends T, F>(
        predicate: (value: T) => value is S,
        callback: (value: S) => F,
    ): Matcher<T, R | F>;
    when<F>(
        predicate: (value: T) => boolean,
        callback: (value: T) => F,
    ): Matcher<T, R | F>;
    when<F>(
        predicate: (value: T) => boolean,
        callback: (value: any) => F,
    ): Matcher<T, R | F> {
        if (!this.resolved && predicate(this.value)) {
            this.handleCallback(callback);
        }
        return this as unknown as Matcher<T, R | F>;
    }

    none<F>(callback: (value: T) => F): R | F {
        if (!this.resolved) {
            this.handleCallback(callback);
        }

        if (this.isAsync) {
            return Promise.resolve(this.result) as R | F;
        }

        return this.result as R | F;
    }
}
