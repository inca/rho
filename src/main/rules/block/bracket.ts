import { Rule, Region, Cursor, Node } from '../../core';

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
        const end = cursor.indexOfEscaped(closeMarker);
        if (end == null) {
            return null;
        }
        const region = cursor.readUntil(end);
        cursor.skip(closeMarker.length);
        return this.parseSubRegion(region);
    }
}
