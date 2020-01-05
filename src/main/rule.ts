import { Cursor } from './cursor';
import { Node } from './node';
import { Processor } from './processor';
import { StringRegion } from './region';

/**
 * Rho has modular parsing system.
 *
 * Each parser (i.e. block, inline, code, etc) is configured
 * using a sequence of parsing rules. During parsing a cursor
 * over the region is created and rule is sequentially called
 * on it, until one of the rules emits the AST Node — or until
 * the cursor finishes traversing the region.
 */
export abstract class Rule {
    constructor(readonly processor: Processor) {}
    abstract parse(cursor: Cursor): Node | null;
}

export abstract class BracketRule extends Rule {
    abstract openMarker: string;
    abstract closeMarker: string;

    abstract parseSubRegion(region: StringRegion): Node;

    parse(cursor: Cursor): Node | null {
        const { openMarker, closeMarker } = this;
        if (!cursor.at(openMarker)) {
            return null;
        }
        cursor.skip(openMarker.length);
        // Look for closeMarker, ignoring backslashes
        const end = cursor.lookahead(cur => {
            while (cur.hasCurrent()) {
                if (cur.at('\\')) {
                    cur.skip(2);
                }
                if (cur.at(closeMarker)) {
                    return cur.position();
                }
                cur.skip();
            }
            return null;
        });
        if (end == null) {
            return null;
        }
        const region = cursor.readUntil(end);
        cursor.skip(closeMarker.length);
        return this.parseSubRegion(region);
    }
}
