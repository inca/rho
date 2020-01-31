import { Cursor, Region, constants } from '../../core';
import { BlockRule } from './block';
import { HtmlElementNode } from '../../nodes';

const { CHAR_MINUS } = constants;

export class HrRule extends BlockRule {

    protected scanBlock(cursor: Cursor): Region | null {
        if (!cursor.atSeq(CHAR_MINUS, CHAR_MINUS, CHAR_MINUS)) {
            return null;
        }
        const start = cursor.pos;
        cursor.skipToEndOfBlock().skipBlankLines();
        return cursor.subRegion(start, cursor.pos);
    }

    protected parseSubRegion(region: Region) {
        const cursor = new Cursor(region);
        while (cursor.atCode(CHAR_MINUS)) {
            cursor.skip();
        }
        cursor.skipBlankLines();
        if (cursor.hasCurrent()) {
            // No other characters allowed, so this is not a correct hr
            return null;
        }
        return new HtmlElementNode(region, [], 'hr', this.selector, false, true);
    }

}
