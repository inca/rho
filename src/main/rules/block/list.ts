import { Cursor, Node, Region, Context } from '../../core';
import { HtmlElementNode } from '../../nodes';
import { BlockRule } from './block';
import { Selector } from '../../util/selector';

export type CursorMatcher = (cursor: Cursor) => void;

/**
 * A generic (and a bit over-complicated) rule for processing list blocks
 * with support for indentation-based nesting.
 *
 * Lists start with a specified marker. Unlike other blocks which typically
 * are processed till end-of-block (a blank line or eof) lists also
 * consume adjacent blocks with matching marker and indentation.
 *
 * Lists also support nested block markup as long as it has an indentation
 * not less than the indentation of the list itself
 * (i.e. the first line of the list block).
 *
 * One special case is "terse lists" which produce `<li>` with inline markup
 * in them and support nested terse lists.
 */
export class ListRule extends BlockRule {
    tagName: string;
    marker: string;

    constructor(
        ctx: Context,
        options: {
            tagName: string;
            marker: string;
            markerMatcher?: CursorMatcher;
        }
    ) {
        super(ctx);
        this.tagName = options.tagName;
        this.marker = options.marker;
    }

    protected allowsMultipleSelectors() {
        return true;
    }

    protected skipMarker(cursor: Cursor) {
        cursor.skipString(this.marker);
    }

    protected isAtMarker(cursor: Cursor) {
        const start = cursor.pos;
        this.skipMarker(cursor);
        const result = cursor.pos > start;
        cursor.set(start);
        return result;
    }

    protected scanBlock(cursor: Cursor): Region | null {
        // Note: first marker of block is always matched against this.marker
        // (not via skipMarker/isAtMarker)
        if (!cursor.at(this.marker)) {
            return null;
        }
        const start = cursor.pos;
        while (cursor.hasCurrent()) {
            cursor.skipToEndOfBlock();
            const endOfBlock = cursor.pos;
            cursor.skipBlankLines();
            // Find the end of this UL, checking nested and sibling sub-blocks
            const startOfLine = cursor.pos;
            if (!cursor.atSpaces(this.indent)) {
                cursor.set(startOfLine);
                break;
            }
            cursor.skip(this.indent);
            const isSibling = this.isAtMarker(cursor);
            const isSubBlock = cursor.atSpace();
            if (!isSibling && !isSubBlock) {
                cursor.set(endOfBlock);
                break;
            }
        }
        return cursor.subRegion(start, cursor.pos);
    }

    protected parseSubRegion(region: Region) {
        const regions: Region[] = [];
        const cursor = new Cursor(region);
        this.skipMarker(cursor);
        let hasBlocks = false;
        let start = cursor.pos;
        while (cursor.hasCurrent()) {
            cursor.skipToEol().skipNewLine();
            if (cursor.atBlankLine()) {
                cursor.skipBlankLines();
                if (cursor.hasCurrent()) {
                    hasBlocks = true;
                }
            }
            if (cursor.atSpaces(this.indent)) {
                cursor.skip(this.indent);
            }
            if (this.isAtMarker(cursor)) {
                const region = cursor.subRegion(start, cursor.pos);
                regions.push(region);
                this.skipMarker(cursor);
                start = cursor.pos;
            }
        }
        // Emit last li
        const lastRegion = cursor.subRegion(start, cursor.pos);
        regions.push(lastRegion);
        const children = this.parseLiRegions(regions, hasBlocks);
        return new HtmlElementNode(lastRegion, children, this.tagName, this.selector);
    }

    protected parseLiRegions(regions: Region[], hasBlocks: boolean): Node[] {
        const nodes = [];
        for (const region of regions) {
            let cursor = new Cursor(region);
            const selector = this.parseSelectorAt(cursor.clone(), true);
            if (selector) {
                cursor = new Cursor(region.taintRegion(selector.region));
            }
            const li = hasBlocks ?
                this.parseBlockLi(cursor, selector) :
                this.parseTerseLi(cursor, selector);
            nodes.push(li);
        }
        return nodes;
    }

    protected parseTerseLi(cursor: Cursor, selector: Selector | null): Node {
        const children: Node[] = [];
        // Terse lists start with inline markup and are scanned line-by-line,
        // looking for the lists inside with list parser.
        // Anything else should not exist, as per parseSubRegion's contract.
        const listParser = this.ctx.getParser('list');
        // Always skip first new line
        let inlineStart = cursor.pos;
        cursor.skipToEol().skipNewLine();
        while (cursor.hasCurrent()) {
            const pos = cursor.pos;
            const list = listParser.parseSinglePass(cursor);
            if (list) {
                // Finish inline markup
                if (inlineStart !== pos) {
                    const region = cursor.subRegion(inlineStart, pos);
                    children.push(...this.parseInlineContent(region));
                }
                // Append list
                children.push(list);
                // Start new inline fragment from here
                inlineStart = cursor.pos;
            } else {
                cursor.skipToEol().skipBlankLines();
            }
        }
        if (inlineStart !== cursor.pos) {
            const region = cursor.subRegion(inlineStart, cursor.pos);
            children.push(...this.parseInlineContent(region));
        }
        return new HtmlElementNode(cursor.region, children, 'li', selector);
    }

    protected parseBlockLi(cursor: Cursor, selector: Selector | null): Node {
        const blockParser = this.ctx.getParser('block');
        const ast = blockParser.parse(cursor.region);
        return new HtmlElementNode(cursor.region, ast.children, 'li', selector);
    }

}

export class NumberedListRule extends ListRule {

    protected skipMarker(cursor: Cursor) {
        let startsWithDigit = false;
        while (cursor.atDigit()) {
            startsWithDigit = true;
            cursor.skip();
        }
        if (startsWithDigit) {
            cursor.skipString('. ');
        }
    }

}
