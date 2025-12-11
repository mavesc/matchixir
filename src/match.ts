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

    with<F>(pattern: Pattern<T>, callback: (args: any) => F): this {
        if (!this.resolved && matches(this.value, pattern)) {
            this.handleCallback(callback);
        }
        return this;
    }

    when<F>(predicate: (value: T) => boolean, callback: (args: any) => F): this {
        if (!this.resolved && predicate(this.value)) {
            this.handleCallback(callback);
        }
        return this;
    }

    none<F>(callback: (args: any) => F): Promise<F> | F {
        if (!this.resolved) {
            this.handleCallback(callback);
        }

        if (this.isAsync) {
            return Promise.resolve(this.result as F);
        }

        return this.result as F;
    }
}
