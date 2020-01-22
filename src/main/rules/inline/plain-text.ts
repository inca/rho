import { TextNode } from '../../nodes/text';
import {
    Rule,
    Processor,
    Cursor,
    Node,
    convertCharCodes,
    constants,
} from '../../core';

const {
    RANGE_DIGIT_START,
    RANGE_DIGIT_END,
    RANGE_LATIN_LOWER_START,
    RANGE_LATIN_LOWER_END,
    RANGE_LATIN_UPPER_START,
    RANGE_LATIN_UPPER_END,
    CHAR_SPACE,
    CHAR_LF,
    CHAR_CR,
} = constants;

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
