import {
    Rule,
    Cursor,
    Node,
    constants,
    Context,
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
        ctx: Context,
        options: {
            controlCharacters?: number[];
        } = {},
    ) {
        super(ctx);
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
