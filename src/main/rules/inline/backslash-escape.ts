import { Rule } from '../../rule';
import { Cursor } from '../../cursor';
import { TextNode } from '../../nodes/text';
import { Node } from '../../node';

/**
 * Emits backslash escape of control character.
 */
export class BackslashEscapeRule extends Rule {

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
        return this.processor.config.controlCharacters.indexOf(char) > -1;
    }

}
