import { Rule } from '../../rule';
import { Cursor } from '../../cursor';
import { TextNode } from '../../nodes/text';
import { Node } from '../../node';

// TODO make configurable
const inlineControlCharacters = '\\&<>`!@#$%^&*()-+=_"<>{}[]~';

export class PlainTextRule extends Rule {

    parse(cursor: Cursor): Node | null {
        const start = cursor.position();
        while (cursor.hasCurrent()) {
            const char = cursor.current();
            const found = inlineControlCharacters.indexOf(char);
            if (found > -1) {
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

}
