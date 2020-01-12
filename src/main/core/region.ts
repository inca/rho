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

    taint(from: number, to: number) {
        const taint: Taint = [from, to];
        return new TaintedRegion(this.str, this.start, this.end, [taint]);
    }

    taintRelative(from: number, to: number) {
        return this.taint(this.start + from, this.start + to);
    }

    taintRegion(subRegion: Region) {
        return this.taint(subRegion.start, subRegion.end);
    }

    toString() {
        return this.substring(0);
    }
}

/**
 * Taints provide an elegant solution to "hide" arbitrary subregions inside given region.
 * Each taint is a pair of indices (in source string space) that indicate subregions
 * that must not be returned by `charAt`, `substring` and `toString` methods.
 *
 * Taints work in conjunction with `subRegion` to make sure the correct indexing is maintained
 * top-to-bottom no matter what.
 */
export class TaintedRegion extends Region {
    protected taints: Taint[];

    constructor(
        str: string,
        start: number = 0,
        end: number = str.length,
        taints: Taint[] = [],
    ) {
        super(str, start, end);
        this.taints = taints.slice()
            .sort((a, b) => a > b ? 1 : -1)
            .filter(t => {
                return t[0] < end && t[1] > start;
            });
    }

    charAt(i: number) {
        const index = this.start + i;
        for (const taint of this.taints) {
            if (index >= taint[0] && index < taint[1]) {
                return '';
            }
        }
        return this.str.charAt(index);
    }

    substring(start: number, end: number = this.length) {
        start = this.start + Math.max(0, start);
        end = this.start + Math.min(this.length, end);
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
            result += this.str.substring(s, e);
            s = taint[1];
        }
        if (s < end) {
            result += this.str.substring(s, end);
        }
        return result;
    }

    taint(from: number, to: number) {
        const taint: Taint = [from, to];
        return new TaintedRegion(this.str, this.start, this.end, this.taints.concat([taint]));
    }

    subRegion(start: number, end: number = this.length) {
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        return new TaintedRegion(this.str, this.start + start, this.start + end, this.taints);
    }

    toString() {
        return this.substring(0);
    }

}

export type Taint = [number, number];
