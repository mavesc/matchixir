export const _: any = Symbol("wildcard");

export function match<T>(value: T): Matcher<T> {
    return new Matcher(value);
}

type Pattern<T> = Partial<T> | T | typeof _;

function matches<T>(value: T, pattern: Pattern<T>): boolean {
    if (pattern === _) return true;

    if (Object.is(value, pattern)) return true;

    if (Array.isArray(pattern) && Array.isArray(value)) {
        if (pattern.length !== value.length) return false;
        return pattern.every((pVal, i) => matches(value[i], pVal));
    }

    if (isObject(value) && isObject(pattern)) {
        return Object.entries(pattern).every(([key, pVal]) => {
            const val = (value as any)[key];
            return matches(val, pVal);
        });
    }

    return false;
}

function isObject(val: unknown): val is Record<string, unknown> {
    return typeof val === "object" && val !== null;
}

export class Matcher<T> {
    private resolved = false;
    private value: T;
    private result: unknown;

    constructor(value: T) {
        this.value = value;
    }

    with<F>(pattern: Pattern<T>, callback: (args: any) => F): this {
        if (!this.resolved && matches(this.value, pattern)) {
            this.result = callback(this.value);
            this.resolved = true;
        }
        return this;
    }

    when<F>(predicate: (value: T) => boolean, callback: (args: any) => F): this {
        if (!this.resolved && predicate(this.value)) {
            this.result = callback(this.value);
            this.resolved = true;
        }
        return this;
    }

    none<F>(callback: (args: any) => F): F {
        if (!this.resolved) {
            this.result = callback(this.value);
            this.resolved = true;
        }
        return this.result as F;
    }
}
