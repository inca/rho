import { Rule, Processor, Cursor, Node } from '../../core';
import { TextNode } from '../../nodes/text';
import { DEFAULT_CONTROL_CHARACTERS } from '../../util';

/**
 * Emits plain text up to the next control character, respecting backslash escapes.
 */
export class PlainTextRule extends Rule {
    controlCharacters: string;

    constructor(
        processor: Processor,
        options: {
            controlCharacters?: string,
        } = {},
    ) {
        super(processor);
        this.controlCharacters = options.controlCharacters ?? DEFAULT_CONTROL_CHARACTERS;
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
        if (code === 0x21 || code === 0x0A) {
            return false;
        }
        // Optimize for 0-9, a-z and A-Z ranges
        if (
            code >= 0x30 && code <= 0x39 ||
            code >= 0x41 && code <= 0x5a ||
            code >= 0x61 && code <= 0x7a
        ) {
            return false;
        }
        const char = String.fromCodePoint(code);
        return this.controlCharacters.indexOf(char) > -1;
    }

}
