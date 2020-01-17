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
    readonly taints: Taint[];

    constructor(
        readonly str: string,
        readonly start: number = 0,
        readonly end: number = str.length,
        taints: Taint[] = [],
    ) {
        this.length = this.end - this.start;
        this.taints = taints.slice()
            .sort((a, b) => a[0] > b[0] ? 1 : -1)
            .filter(t => t[0] < end && t[1] > start);
    }

    charAt(i: number) {
        if (i < 0 || i >= this.length) {
            return '';
        }
        const index = this.start + i;
        if (this.taints.length > 0) {
            for (const taint of this.taints) {
                if (index >= taint[0] && index < taint[1]) {
                    return '';
                }
            }
        }
        return this.str.charAt(index);
    }

    substring(start: number, end: number = this.length) {
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        if (!this.taints.length) {
            return this.str.substring(this.start + start, this.start + end);
        }
        let result = '';
        const indexes = this.untaintedIndexes(start, end);
        for (const [s, e] of indexes) {
            result += this.str.substring(s, e);
        }
        return result;
    }

    subRegion(start: number, end: number = this.length) {
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        return new Region(this.str, this.start + start, this.start + end, this.taints);
    }

    toString() {
        return this.substring(0);
    }

    /**
     * Taints provide an elegant solution to "hide" arbitrary subregions inside given region.
     * Each taint is a pair of indices (in source string space) that indicate subregions
     * that must not be returned by `charAt`, `substring` and `toString` methods.
     *
     * Taints work in conjunction with `subRegion` to make sure the correct indexing is maintained
     * top-to-bottom no matter what.
     */
    taint(from: number, to: number) {
        const taint: Taint = [from, to];
        return new Region(this.str, this.start, this.end, this.taints.concat([taint]));
    }

    taintRelative(from: number, to: number) {
        return this.taint(this.start + from, this.start + to);
    }

    taintRegion(subRegion: Region) {
        return this.taint(subRegion.start, subRegion.end);
    }

    untaint(): Region[] {
        const result: Region[] = [];
        const indexes = this.untaintedIndexes(0, this.length);
        for (const [s, e] of indexes) {
            const region = new Region(this.str, s, e);
            result.push(region);
        }
        return result;
    }

    protected untaintedIndexes(start: number, end: number): number[][] {
        const result: number[][] = [];
        start = this.start + Math.max(0, start);
        end = this.start + Math.min(this.length, end);
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
            result.push([s, e]);
            s = taint[1];
        }
        if (s < end) {
            result.push([s, end]);
        }
        return result;
    }

}

export type Taint = [number, number];
