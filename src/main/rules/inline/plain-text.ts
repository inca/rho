import { TextNode } from '../../nodes/text';
import {
    Rule,
    Processor,
    Cursor,
    Node,
    constants,
} from '../../core';

const {
    DEFAULT_CONTROL_CHARACTERS,
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
            controlCharacters?: number[],
        } = {},
    ) {
        super(processor);
        this.controlCharacters = options.controlCharacters ?? DEFAULT_CONTROL_CHARACTERS;
    }

    protected parseAt(cursor: Cursor): Node | null {
        const start = cursor.pos;
        while (cursor.hasCurrent()) {
            const code = cursor.currentCode();
            // Optimize for a-z, A-Z, 0-9 and whitespace
            if (
                code >= RANGE_LATIN_LOWER_START && code <= RANGE_LATIN_LOWER_END ||
                code >= RANGE_LATIN_UPPER_START && code <= RANGE_LATIN_UPPER_END ||
                code >= RANGE_DIGIT_START && code <= RANGE_DIGIT_END ||
                code === CHAR_SPACE || code === CHAR_LF || code === CHAR_CR
            ) {
                cursor.skip();
                continue;
            }
            if (this.controlCharacters.indexOf(code) > -1) {
                break;
            }
            cursor.skip();
        }
        if (cursor.pos === start) {
            return null;
        }
        return new TextNode(cursor.subRegion(start, cursor.pos));
    }

}
