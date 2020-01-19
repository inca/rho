import {
    Rule,
    Cursor,
    Node,
    Processor,
    convertCharCodes,
} from '../../core';
import { TextNode } from '../../nodes/text';

const CHAR_BACKSLASH = 0x5c;

/**
 * Emits backslash escape of control character.
 */
export class BackslashEscapeRule extends Rule {
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
        if (cursor.atCode(CHAR_BACKSLASH)) {
            const next = cursor.peekCode(1);
            if (this.isControlChar(next)) {
                cursor.skip();
                return new TextNode(cursor.readForward(1));
            }
        }
        return null;
    }

    isControlChar(code: number) {
        return this.controlCharacters.indexOf(code) > -1;
    }

}
