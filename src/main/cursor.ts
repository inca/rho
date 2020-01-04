import { StringSource } from './source';
import { CursorConfig } from './config';

/**
 * Cursor tracks a position `pos` within a string source.
 */
export class Cursor {

    constructor(
        readonly config: CursorConfig,
        readonly source: StringSource,
        protected pos: number = 0,
    ) {
    }

    /**
     * Returns current cursor position.
     */
    position() {
        return this.pos;
    }

    /**
     * Returns a copy of this cursor.
     */
    clone() {
        return new Cursor(this.config, this.source, this.pos);
    }

    /**
     * Returns next character without advancing cursor position.
     */
    peek() {
        return this.source.charAt(this.pos + 1);
    }

    /**
     * Returns character at current cursor position.
     */
    current() {
        return this.source.charAt(this.pos);
    }

    /**
     * Indicates whether cursor points within the source.
     */
    hasCurrent() {
        return (this.pos + 1) < this.source.length;
    }

    /**
     * Advances cursor forward by `n` characters.
     */
    skip(n: number = 1): this {
        this.pos += n;
        return this;
    }

    /**
     * Sets cursor position back to 0.
     */
    reset(): this {
        this.pos = 0;
        return this;
    }

    /**
     * Sets cursor position to `i`.
     */
    set(i: number): this {
        this.pos = i;
        return this;
    }

    /**
     * Invokes `fn` with copy of cursor as an argument, and returns its result.
     */
    lookahead<T>(fn: (cursor: Cursor) => T): T {
        return fn(this.clone());
    }

    /**
     * Advances the cursor to specified position, and returns the substring traversed
     * from old position to new position.
     */
    yieldUntil(newPos: number): string {
        if (newPos <= this.pos) {
            return '';
        }
        const result = this.source.substring(this.pos, newPos);
        this.set(newPos);
        return result;
    }

    /**
     * Scans till next inline control character (as specified in `config`)
     * and returns the traversed substring.
     */
    yieldInlineText() {
        const start = this.pos;
        let found = false;
        while (!found && this.hasCurrent()) {
            const c = this.current();
            found = this.config.inlineControlChars.indexOf(c) > -1;
            if (!found) {
                this.skip();
            }
        }
        return this.source.substring(start, this.pos);
    }

    /**
     * Tests if cursor is currently positioned at specified string.
     */
    at(str: string) {
        const end = this.pos + str.length;
        if (end > this.source.length) {
            return false;
        }
        return this.source.substring(this.pos, end) === str;
    }

}
