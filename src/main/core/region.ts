export interface StringLike {
    length: number;
    charAt(i: number): string;
    substring(start: number, end?: number): string;
    toString(): string;
}

/**
 * Provides a virtual region over the specified `str`.
 * The trick is that no actual string copies occur most of the time
 * (i.e. until either `substring` or `toString` are called)
 * which means most operations rely on very performant index arithmentics.
 */
export class Region implements StringLike {
    length: number;

    constructor(
        readonly str: string,
        readonly start: number = 0,
        readonly end: number = str.length,
    ) {
        this.length = this.end - this.start;
    }

    charAt(i: number) {
        if (i < 0 || i >= this.length) {
            return '';
        }
        return this.str.charAt(this.start + i);
    }

    substring(start: number, end: number = this.length) {
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        return this.str.substring(this.start + start, this.start + end);
    }

    subRegion(start: number, end: number = this.length) {
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        return new Region(this.str, this.start + start, this.start + end);
    }

    toString() {
        return this.substring(0);
    }
}
