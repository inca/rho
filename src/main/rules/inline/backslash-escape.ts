import { Rule, Cursor, Node, Processor } from '../../core';
import { TextNode } from '../../nodes/text';

/**
 * Emits backslash escape of control character.
 */
export class BackslashEscapeRule extends Rule {
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
        if (cursor.at('\\')) {
            const next = cursor.peek(1);
            if (this.isControlChar(next)) {
                cursor.skip();
                return new TextNode(cursor.readForward(1));
            }
        }
        return null;
    }

    isControlChar(char: string) {
        return this.controlCharacters.indexOf(char) > -1;
    }

}
