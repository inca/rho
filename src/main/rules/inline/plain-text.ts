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
            const current = cursor.current();
            if (this.isControlChar(current)) {
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

    isControlChar(char: string) {
        return char && this.controlCharacters.indexOf(char) > -1;
    }

}
