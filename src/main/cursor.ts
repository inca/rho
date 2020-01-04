import { StringRegion } from './region';

/**
 * Cursor tracks a position `pos` within a string source.
 *
 * Implementation note: normally it is preferable to use high order functions like
 * `lookahead` for traversal to avoid side effects. However, simple profiling shows that
 * manually setting `pos` variable and using imperative loops like `while` nets around
 * 10x performance boost compared to functional approach which relies on call stacks not
 * optimizable (e.g. inline-able) in runtime.
 * This is obviously a huge deal in text traversal/parsing, so it is encouraged that
 * methods defined here rely as much as possible on imperative programming and
 * contracts covered by tests.
 */
export class Cursor {
    readonly region: StringRegion;
    protected pos: number = 0;

    constructor(
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
        return new Cursor(this.region, this.pos);
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
        return this.pos < this.region.length;
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
     * Tests if cursor is positioned at any of the specified strings.
     * If a single string is specified, each of its character is matched instead.
     */
    atSome(strings: string[] | string) {
        for (const s of strings) {
            if (this.at(s)) {
                return true;
            }
        }
        return false;
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
     * Same as `readUntil`, but new position is relative to current cursor position.
     */
    readForward(relNewPos: number): StringRegion {
        return this.readUntil(this.position() + relNewPos);
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
