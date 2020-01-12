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

    taint(taint: [number, number]) {
        return new TaintedRegion(this.str, this.start, this.end, [taint]);
    }

    toString() {
        return this.substring(0);
    }
}

export class TaintedRegion extends Region {
    protected taints: Array<[number, number]>;

    constructor(
        str: string,
        start: number = 0,
        end: number = str.length,
        taints: Array<[number, number]> = [],
    ) {
        super(str, start, end);
        this.taints = taints.slice().sort((a, b) => a > b ? 1 : -1);
    }

    charAt(i: number) {
        for (const taint of this.taints) {
            if (i >= taint[0] && i < taint[1]) {
                return '';
            }
        }
        return super.charAt(i);
    }

    substring(start: number, end: number = this.length) {
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        let result = '';
        let s = start;
        for (const taint of this.taints) {
            if (taint[1] < s) {
                continue;
            }
            if (taint[0] <= s) {
                s = taint[1];
                continue;
            }
            const e = Math.min(end, taint[0]);
            if (s >= e) {
                break;
            }
            result += this.str.substring(this.start + s, this.start + e);
            s = taint[1];
        }
        if (s < end) {
            result += this.str.substring(this.start + s, this.start + end);
        }
        return result;
    }

    taint(taint: [number, number]) {
        // TODO collapse taints?
        return new TaintedRegion(this.str, this.start, this.end, this.taints.concat([taint]));
    }

    subRegion(start: number, end: number = this.length) {
        // TODO strip taints outside subregion
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        return new TaintedRegion(this.str, this.start + start, this.start + end, this.taints);
    }

    toString() {
        return this.substring(0);
    }
}
