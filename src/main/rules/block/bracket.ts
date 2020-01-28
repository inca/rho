import { Rule, Region, Cursor, Node, constants } from '../../core';

const { CHAR_BACKSLASH } = constants;

/**
 * A convenience rule that parsers content between opening and closing markers.
 * Typical examples of such rules are: ems, strongs, strikethoughs, code spans and formulae.
 */
export abstract class BracketRule extends Rule {
    abstract openMarker: string;
    abstract closeMarker: string;

    protected abstract parseSubRegion(region: Region): Node;

    protected parseAt(cursor: Cursor): Node | null {
        const { openMarker, closeMarker } = this;
        if (!cursor.at(openMarker)) {
            return null;
        }
        cursor.skip(openMarker.length);
        // Look for closeMarker, ignoring backslashes
        const start = cursor.pos;
        while (cursor.hasCurrent()) {
            if (cursor.atCode(CHAR_BACKSLASH)) {
                cursor.skip(2);
                continue;
            }
            if (cursor.at(closeMarker)) {
                const region = cursor.subRegion(start, cursor.pos);
                cursor.skip(closeMarker.length);
                return this.parseSubRegion(region);
            }
            cursor.skip();
        }
        return null;
    }
}
