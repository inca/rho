import { Rule } from '../../rule';
import { Cursor } from '../../cursor';
import { TextNode } from '../../nodes/text';
import { Node } from '../../node';

/**
 * Emits plain text up to the next control character, respecting backslash-escapes.
 */
export class PlainTextRule extends Rule {

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
        return this.processor.config.controlCharacters.indexOf(char) > -1;
    }

}
