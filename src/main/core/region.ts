import { globalStats } from './stats';

export interface StringLike {
    length: number;
    charAt(i: number): string;
    substring(start: number, end?: number): string;
    toString(): string;
}

export type Taint = [number, number];

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
        globalStats.Region++;
        this.length = this.end - this.start;
    }

    charAt(i: number) {
        globalStats.charAt++;
        if (i < 0 || i >= this.length) {
            return '';
        }
        return this.str.charAt(this.start + i);
    }

    substring(start: number, end: number = this.length) {
        globalStats.substring++;
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        return this.str.substring(this.start + start, this.start + end);
    }

    subRegion(start: number, end: number = this.length) {
        globalStats.subRegion++;
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        return new Region(this.str, this.start + start, this.start + end);
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
        globalStats.taint++;
        const taint: Taint = [from, to];
        if (!isTaintInRegion(this.start, this.end, taint)) {
            return this;
        }
        return new TaintedRegion(this.str, this.start, this.end, [taint]);
    }

    taintRelative(from: number, to: number) {
        return this.taint(this.start + from, this.start + to);
    }

    taintRegion(subRegion: Region) {
        return this.taint(subRegion.start, subRegion.end);
    }

    untaint(): Region[] {
        globalStats.untaint++;
        return [this];
    }

}

export class TaintedRegion extends Region {
    constructor(
        readonly str: string,
        readonly start: number = 0,
        readonly end: number = str.length,
        readonly taints: Taint[] = [],
    ) {
        super(str, start, end);
        globalStats.TaintedRegion++;
    }

    charAt(i: number) {
        globalStats.taintedCharAt++;
        if (i < 0 || i >= this.length) {
            return '';
        }
        const index = this.start + i;
        for (const taint of this.taints) {
            if (index >= taint[0] && index < taint[1]) {
                return '';
            }
        }
        return this.str.charAt(this.start + i);
    }

    substring(start: number, end: number = this.length) {
        globalStats.taintedSubstring++;
        start = Math.max(0, start);
        end = Math.min(this.length, end);
        let result = '';
        const indexes = this.untaintedIndexes(start, end);
        for (const [s, e] of indexes) {
            result += this.str.substring(s, e);
        }
        return result;
    }

    subRegion(start: number, end: number = this.length): Region {
        globalStats.taintedSubRegion++;
        start = this.start + Math.max(0, start);
        end = this.start + Math.min(this.length, end);
        const taints = this.taints.filter(t => isTaintInRegion(start, end, t));
        if (taints.length > 0) {
            return new TaintedRegion(this.str, start, end, taints);
        }
        return new Region(this.str, start, end);
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
        globalStats.taintedTaint++;
        const taint: Taint = [from, to];
        if (!isTaintInRegion(this.start, this.end, taint)) {
            return this;
        }
        const taints = this.taints.concat([taint]).sort((a, b) => a[0] > b[0] ? 1 : -1);
        return new TaintedRegion(this.str, this.start, this.end, taints);
    }

    taintRelative(from: number, to: number) {
        return this.taint(this.start + from, this.start + to);
    }

    taintRegion(subRegion: Region) {
        return this.taint(subRegion.start, subRegion.end);
    }

    untaint(): Region[] {
        globalStats.taintedUntaint++;
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

function isTaintInRegion(regionStart: number, regionEnd: number, taint: Taint) {
    return taint[0] < regionEnd && taint[1] > regionStart;
}
