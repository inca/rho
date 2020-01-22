import {
    Rule,
    Cursor,
    Node,
    Processor,
    constants,
} from '../../core';
import { TextNode } from '../../nodes/text';

const {
    DEFAULT_CONTROL_CHARACTERS,
    CHAR_BACKSLASH,
} = constants;

/**
 * Emits backslash escape of control character.
 */
export class BackslashEscapeRule extends Rule {
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
