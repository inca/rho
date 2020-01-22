import { Region } from './region';
import * as constants from './constants';

// Opt: getting these directly from import is roughly x3 slower
const {
    RANGE_DIGIT_START,
    RANGE_DIGIT_END,
    RANGE_LATIN_LOWER_START,
    RANGE_LATIN_LOWER_END,
    RANGE_LATIN_UPPER_START,
    RANGE_LATIN_UPPER_END,
    CHAR_SPACE,
    CHAR_TAB,
    CHAR_LF,
    CHAR_FF,
    CHAR_CR,
    CHAR_BACKSLASH,
    CHAR_MINUS,
    CHAR_UNDERSCORE,
} = constants;

/**
 * Cursor tracks a position `pos` within a string region.
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
    readonly region: Region;

    constructor(
        source: string | Region,
        protected _pos: number = 0,
    ) {
        this.region = source instanceof Region ? source : new Region(source);
    }

    /**
     * Returns current cursor position.
     */
    get pos() {
        return this._pos;
    }

    /**
     * Sets cursor position to `i`.
     */
    set(i: number): this {
        this._pos = i;
        return this;
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
     * Returns next character code without advancing cursor position.
     */
    peekCode(offset: number = 1) {
        return this.region.charCodeAt(this.pos + offset);
    }

    /**
     * Returns character at current cursor position.
     */
    current() {
        return this.region.charAt(this.pos);
    }

    /**
     * Returns character code at current cursor position.
     */
    currentCode() {
        return this.region.charCodeAt(this.pos);
    }

    /**
     * Indicates whether cursor points within the source.
     */
    hasCurrent() {
        return this.pos < this.region.length;
    }

    /**
     * Creates a subregion with specified boundaries.
     */
    subRegion(start: number, end: number = this.region.length) {
        return this.region.subRegion(start, end);
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
     * Tests if current char code equals specified code. Significantly
     * faster than char-based equivalent.
     */
    atCode(code: number): boolean {
        return this.currentCode() === code;
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
        return this.region.substring(this.pos, end).toLowerCase() === str.toLowerCase();
    }

    /**
     * Tests if cursor is currently positioned at decimal digit.
     */
    atDigit(): boolean {
        const c = this.currentCode();
        return c >= RANGE_DIGIT_START && c <= RANGE_DIGIT_END;
    }

    /**
     * Tests if cursor is currently positioned at latin character.
     */
    atLatin(): boolean {
        const c = this.currentCode();
        return c >= RANGE_LATIN_LOWER_START && c <= RANGE_LATIN_LOWER_END ||
            c >= RANGE_LATIN_UPPER_START && c <= RANGE_LATIN_UPPER_END;
    }

    /**
     * Tests if cursor is currently positioned at identifier symbol,
     * equivalent to testing for [0-9A-Za-z_-]
     */
    atIdentifier(): boolean {
        const c = this.currentCode();
        return c >= RANGE_LATIN_LOWER_START && c <= RANGE_LATIN_LOWER_END ||
            c >= RANGE_LATIN_UPPER_START && c <= RANGE_LATIN_UPPER_END ||
            c >= RANGE_DIGIT_START && c <= RANGE_DIGIT_END ||
            c === CHAR_MINUS || c === CHAR_UNDERSCORE;
    }

    /**
     * Tests if current character is newline char, which is either \n or \r.
     */
    atNewLine(): boolean {
        const c = this.currentCode();
        return c === CHAR_LF || c === CHAR_CR;
    }

    /**
     * Tests if cursor is positioned blank line (optional whitespace followed by newline or end of input)
     */
    atBlankLine(): boolean {
        const p = this.pos;
        this.skipSpaces();
        const result = this.atNewLine() || !this.hasCurrent();
        this.set(p);
        return result;
    }

    /**
     * Tests if current character is inline-level space (space or tab).
     */
    atSpace(): boolean {
        const c = this.currentCode();
        return c === CHAR_SPACE || c === CHAR_TAB;
    }

    /**
     * Tests if cursor is positioned at specified number of space characters.
     */
    atSpaces(count: number): boolean {
        for (let i = 0; i < count; i++) {
            const c = this.peekCode(i);
            if (c === CHAR_TAB) {
                i += 3;
                continue;
            }
            if (c !== CHAR_SPACE) {
                return false;
            }
        }
        return true;
    }

    atWhitespace() {
        const c = this.currentCode();
        return c === CHAR_SPACE ||
            c === CHAR_TAB ||
            c === CHAR_LF ||
            c === CHAR_CR ||
            c === CHAR_FF;
    }

    /**
     * Tests if cursor is positioned within a tainted region.
     */
    atTaint() {
        return this.currentCode() === 0 && this.pos < this.region.length;
    }

    /**
     * Scans forward till positioned at `str` and returns its index, if found.
     * Backslash escapes are ignored.
     */
    indexOfEscaped(str: string): number | null {
        const cur = this.clone();
        while (cur.hasCurrent()) {
            if (cur.atCode(CHAR_BACKSLASH)) {
                cur.skip(2);
                continue;
            }
            if (cur.at(str)) {
                return cur.pos;
            }
            cur.skip();
        }
        return null;
    }

    /**
     * Advances cursor forward by `n` characters.
     */
    skip(n: number = 1): this {
        this._pos += n;
        return this;
    }

    /**
     * Skips specified string, if positioned at it, otherwise do nothing.
     */
    skipString(str: string): this {
        if (this.at(str)) {
            this.skip(str.length);
        }
        return this;
    }

    /**
     * Skips a sequence of space or tab characters at current cursor position.
     */
    skipSpaces(count: number = -1) {
        let i = count;
        while (this.atSpace() || this.atTaint()) {
            if (i === 0) {
                break;
            }
            i -= 1;
            this.skip();
        }
        return this;
    }

    /**
     * Skips a single newline character, which is either `\r\n` or `\r` or `\n'.
     */
    skipNewLine(): this {
        const code = this.currentCode();
        if (code === CHAR_CR && this.peekCode() === CHAR_LF) {
            this.skip(2);
        } else if (code === CHAR_LF || code === CHAR_CR) {
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
     * Skips all whitespace (spaces, new lines) from current position onwards.
     */
    skipWhitespaces() {
        let pos = -1;
        while (pos !== this.pos) {
            pos = this.pos;
            this.skipSpaces().skipNewLines();
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
            if (this.atNewLine() || !this.hasCurrent()) {
                this.skipNewLines();
            } else {
                // It's a meaningful line!
                this.set(pos);
                break;
            }
        }
        return this;
    }

    /**
     * Skips up to the closest newline character, or to the end of region, whichever comes first.
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
    readUntil(newPos: number): Region {
        newPos = Math.max(this.pos, Math.min(newPos, this.region.length));
        const result = this.region.subRegion(this.pos, newPos);
        this.set(newPos);
        return result;
    }

    /**
     * Same as `readUntil`, but new position is relative to current cursor position.
     */
    readForward(relNewPos: number): Region {
        return this.readUntil(this.pos + relNewPos);
    }

    /**
     * Skips to the end of current line, returning it.
     * The newline character on current line is also skipped.
     */
    readLine(): Region {
        const start = this.pos;
        this.skipToEol().skipNewLine();
        return this.region.subRegion(start, this.pos);
    }

    debug() {
        const fmt = (str: string) => str.replace(/ /g, '·').replace(/\n/g, '↲\n');
        const prefix = this.region.substring(0, this.pos);
        const suffix = this.region.substring(this.pos);
        return '\u001b[33m' + fmt(prefix) + '\u001b[0m' +
            '\u001b[36m' + fmt(suffix) + '\u001b[0m';
    }

}
