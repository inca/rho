import { StringRegion } from './region';
import { CursorConfig } from './config';

/**
 * Cursor tracks a position `pos` within a string source.
 */
export class Cursor {
    readonly region: StringRegion;
    protected pos: number = 0;

    constructor(
        readonly config: CursorConfig,
        source: string | StringRegion,
        pos: number = 0,
    ) {
        this.region = source instanceof StringRegion ? source : new StringRegion(source);
        this.pos = pos;
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
        return new Cursor(this.config, this.region, this.pos);
    }

    /**
     * Returns next character without advancing cursor position.
     */
    peek(offset: number = 1) {
        return this.region.charAt(this.pos + offset);
    }

    /**
     * Returns character at current cursor position.
     */
    current() {
        return this.region.charAt(this.pos);
    }

    /**
     * Indicates whether cursor points within the source.
     */
    hasCurrent() {
        return (this.pos + 1) < this.region.length;
    }

    /**
     * Tests if cursor is currently positioned at specified string.
     */
    at(str: string): boolean {
        const end = this.pos + str.length;
        if (end > this.region.length) {
            return false;
        }
        for (let i = 0; i < str.length; i++) {
            if (str[i] !== this.region.charAt(this.pos + i)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Tests if cursor is currently positioned at specified string,
     * ignoring case.
     */
    atInsensitive(str: string): boolean {
        const end = this.pos + str.length;
        if (end > this.region.length) {
            return false;
        }
        return this.region.substring(this.pos, end).toLowerCase() ===
            str.toLowerCase();
    }

    /**
     * Tests if cursor is currently positioned at decimal digit.
     */
    atDigit(): boolean {
        const c = this.current();
        return c >= '0' && c <= '9';
    }

    /**
     * Tests if cursor is currently positioned at latin character.
     */
    atLatin(): boolean {
        const c = this.current();
        return c >= 'A' && c <= 'z';
    }

    /**
     * Tests if cursor is currently positioned at identifier symbol,
     * equivalent to testing for [0-9A-Za-z_-]
     */
    atIdentifier(): boolean {
        const c = this.current();
        return c >= '0' && c <= '9' || c >= 'A' && c <= 'z' || c === '_' || c === '-';
    }

    /**
     * Tests if current character is newline char, which is either \n or \r.
     */
    atNewLine(): boolean {
        const c = this.current();
        return c === '\n' || c === '\r';
    }

    /**
     * Tests if current character is inline-level space (space or tab).
     */
    atSpace(): boolean {
        return this.at(' ') || this.at('\t');
    }

    /**
     * Tests if cursor is positioned at specified number of space characters.
     */
    atSpaces(count: number): boolean {
        for (let i = 0; i < count; i++) {
            if (this.peek(i) !== ' ') {
                return false;
            }
        }
        return true;
    }

    /**
     * Tests if cursor is positioned at whitespace.
     */
    atWhitespace() {
        return this.atNewLine() || this.atSpace();
    }

    /**
     * Invokes `fn` with copy of cursor as an argument, and returns its result.
     */
    lookahead<T>(fn: (cursor: Cursor) => T): T {
        return fn(this.clone());
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
     * Advances cursor forward by `n` characters.
     */
    skip(n: number = 1): this {
        this.pos += n;
        return this;
    }

    /**
     * Skips a sequence of space or tab characters at current cursor position.
     */
    skipSpaces() {
        while (this.atSpace()) {
            this.skip();
        }
        return this;
    }

    /**
     * Skips a single newline character, which is either `\r\n` or `\r` or `\n'.
     */
    skipNewLine(): this {
        if (this.at('\r\n')) {
            this.skip(2);
        } else if (this.atNewLine()) {
            this.skip();
        }
        return this;
    }

    /**
     * Skips all newline characters at current cursor position.
     */
    skipNewLines(): this {
        let pos = -1;
        while (pos !== this.pos) {
            pos = this.pos;
            this.skipNewLine();
        }
        return this;
    }

    /**
     * Skip all consequential whitespace characters at current cursor position.
     */
    skipWhitespaces() {
        while (this.atWhitespace()) {
            this.skip();
        }
        return this;
    }

    /**
     * Skips blank lines, i.e. lines containing only whitespace characters,
     * up to the beginning of the next line containing meaningful content.
     *
     * Important note: unlike `skipWhitespace` this method will retain
     * the indentation of the next meaningful line.
     */
    skipBlankLines(): this {
        while (this.hasCurrent()) {
            const pos = this.pos;
            this.skipSpaces();
            if (this.atNewLine()) {
                this.skipNewLines();
            } else {
                // It's a meaningful line!
                this.pos = pos;
                break;
            }
        }
        return this;
    }

    /**
     * Skips up to the closest newline character, or to the end of source.
     */
    skipToEol(): this {
        while (this.hasCurrent() && !this.atNewLine()) {
            this.skip();
        }
        return this;
    }

    /**
     * Skips to the end of current block, which is EOL followed by EOF or a blank line.
     */
    skipToEndOfBlock(): this {
        while (this.hasCurrent()) {
            if (this.atNewLine()) {
                const i = this.pos;
                if (this.skipNewLine().skipSpaces().atNewLine()) {
                    this.set(i);
                    break;
                }
            }
            this.skip();
        }
        return this;
    }

    /**
     * Advances the cursor to specified position, and returns the substring traversed
     * from old position to new position.
     */
    readUntil(newPos: number): StringRegion {
        newPos = Math.max(this.pos, newPos);
        const result = this.region.subRegion(this.pos, newPos);
        this.set(newPos);
        return result;
    }

    /**
     * Skips to the next inline control character (as specified in `config`)
     * and returns the traversed substring.
     */
    readInlineText(): StringRegion {
        const start = this.pos;
        let found = false;
        while (!found && this.hasCurrent()) {
            const c = this.current();
            found = this.config.inlineControlChars.indexOf(c) > -1;
            if (!found) {
                this.skip();
            }
        }
        return this.region.subRegion(start, this.pos);
    }

    /**
     * Skips to the end of current line, returning it.
     * The newline character on current line is also skipped.
     */
    readLine(): StringRegion {
        const start = this.pos;
        this.skipToEol().skipNewLine();
        return this.region.subRegion(start, this.pos);
    }

}
