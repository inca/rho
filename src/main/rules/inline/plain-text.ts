import { Rule, Processor, Cursor, Node } from '../../core';
import { TextNode } from '../../nodes/text';

/**
 * Emits plain text up to the next control character, respecting backslash-escapes.
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
        this.controlCharacters = options.controlCharacters ?? '\\`~!@#$%^&*()-_+="<>{}[]';
    }

    parse(cursor: Cursor): Node | null {
        const start = cursor.position();
        while (cursor.hasCurrent()) {
            const current = cursor.current();
            if (this.isControlChar(current)) {
                break;
            } else {
                cursor.skip();
            }
        }
        if (cursor.position() === start) {
            return null;
        }
        return new TextNode(cursor.subRegion(start, cursor.position()));
    }

    isControlChar(char: string) {
        return this.controlCharacters.indexOf(char) > -1;
    }

}
