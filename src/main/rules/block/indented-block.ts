import { Cursor, Region, constants } from '../../core';
import { BlockRule } from './block';
import { HtmlElementNode } from '../../nodes';

const {
    CHAR_TILDE,
} = constants;

export class IndentedBlock extends BlockRule {
    tagName: string = '';

    protected scanBlock(cursor: Cursor): Region | null {
        if (!cursor.atCode(CHAR_TILDE)) {
            return null;
        }
        cursor.skip();
        this.tagName = this.readTagName(cursor);
        if (!this.tagName) {
            return null;
        }
        while (cursor.atSpace()) {
            cursor.skip();
        }
        const contentStart = cursor.pos;
        while (cursor.hasCurrent()) {
            cursor.skipToEndOfBlock().skipBlankLines();
            if (!cursor.atSpaces(this.indent + 2)) {
                break;
            }
        }
        return cursor.subRegion(contentStart, cursor.pos);
    }

    protected readTagName(cursor: Cursor): string {
        const start = cursor.pos;
        while (cursor.hasCurrent() && cursor.atIdentifier()) {
            cursor.skip();
        }
        return cursor.subRegion(start, cursor.pos).toString();
    }

    protected parseSubRegion(region: Region) {
        const cursor = new Cursor(region);
        cursor.skipTainted();
        const isBlock = cursor.atNewLine();
        const children = isBlock ? this.parseBlockContent(region) : this.parseInlineContent(region);
        return new HtmlElementNode(region, children, this.tagName, this.selector);
    }

}
