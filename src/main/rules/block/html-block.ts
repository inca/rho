import { Cursor, Region } from '../../core';
import { BlockRule } from './block';
import { TextNode } from '../../nodes';
import { matchHtmlTag, HtmlTagType } from '../../util';

export class HtmlBlockRule extends BlockRule {

    protected scanBlock(cursor: Cursor): Region | null {
        const start = cursor.pos;
        const openingTag = matchHtmlTag(cursor);
        // Only opening tags are supported as html block starters
        if (!openingTag) {
            return null;
        }
        if (openingTag.type !== HtmlTagType.OPENING) {
            return null;
        }
        // Perform line-by-line sweep till we find a closing tag
        // at the start of line, sitting at the same indentation level
        while (cursor.hasCurrent()) {
            cursor
                .skipToEol()
                .skipNewLine()
                .skipSpaces(this.indent);
            const closingTag = matchHtmlTag(cursor);
            if (!closingTag) {
                continue;
            }
            if (closingTag.type !== HtmlTagType.CLOSING ||
                closingTag.tagName !== openingTag.tagName) {
                continue;
            }
            // We have our closing tag, one final rule remaining:
            // there has to be end-of-block after it.
            cursor.skipSpaces();
            if (cursor.atBlankLine()) {
                cursor.skipNewLine();
                if (cursor.atBlankLine()) {
                    return cursor.subRegion(start, cursor.pos);
                }
            }
        }
        return null;
    }

    protected parseSubRegion(region: Region) {
        // Html blocks are emitted as is
        return new TextNode(region);
    }

    protected parseSelectorAt() {
        // Selector expressions are not supported
        return null;
    }

}
