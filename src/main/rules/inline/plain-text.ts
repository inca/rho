import { TextNode } from '../../nodes/text';
import {
    Rule,
    Processor,
    Cursor,
    Node,
    convertCharCodes,
} from '../../core';

// Opt: getting this from imports is roughly x3 slower.
const CHAR_SPACE = 0x20;
const CHAR_LF = 0x0a;
const CHAR_CR = 0x0d;
const RANGE_LATIN_UPPER_START = 0x41;    // A
const RANGE_LATIN_UPPER_END = 0x5a;      // Z
const RANGE_LATIN_LOWER_START = 0x61;    // a
const RANGE_LATIN_LOWER_END = 0x7a;      // z
const RANGE_DIGIT_START = 0x30;          // 0
const RANGE_DIGIT_END = 0x39;            // 9

/**
 * Emits plain text up to the next control character, respecting backslash escapes.
 */
export class PlainTextRule extends Rule {
    controlCharacters: number[];

    constructor(
        processor: Processor,
        options: {
            controlCharacters?: string | number[],
        } = {},
    ) {
        super(processor);
        this.controlCharacters = convertCharCodes(options.controlCharacters);
    }

    protected parseAt(cursor: Cursor): Node | null {
        const start = cursor.pos;
        while (cursor.hasCurrent()) {
            const code = cursor.currentCode();
            if (this.isControlChar(code)) {
                break;
            } else {
                cursor.skip();
            }
        }
        if (cursor.pos === start) {
            return null;
        }
        return new TextNode(cursor.subRegion(start, cursor.pos));
    }

    isControlChar(code: number) {
        // Spaces and new lines are never control chars
        if (code === CHAR_SPACE || code === CHAR_LF || code === CHAR_CR) {
            return false;
        }
        // Optimize for 0-9, a-z and A-Z ranges
        if (
            code >= RANGE_LATIN_LOWER_START && code <= RANGE_LATIN_LOWER_END ||
            code >= RANGE_LATIN_UPPER_START && code <= RANGE_LATIN_UPPER_END ||
            code >= RANGE_DIGIT_START && code <= RANGE_DIGIT_END
        ) {
            return false;
        }
        return this.controlCharacters.indexOf(code) > -1;
    }

}
