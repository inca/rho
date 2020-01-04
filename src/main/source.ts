export interface StringSource {
    length: number;
    charAt(i: number): string;
    substring(start: number, end?: number): string;
    toString(): string;
}

export class StringRegion implements StringSource {
    length: number;

    constructor(
        readonly str: string,
        readonly start: number,
        readonly end: number,
    ) {
        this.length = this.end - this.start;
    }

    charAt(i: number) {
        if (i < 0 || i >= this.length) {
            return '';
        }
        return this.str.charAt(this.start + i);
    }

    substring(start: number, end?: number) {
        start = Math.max(0, start);
        end = end == null ? this.length : Math.min(this.length, end);
        return this.str.substring(this.start + start, this.start + end);
    }

    toString() {
        return this.substring(0);
    }

}
