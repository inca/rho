import { Cursor, Processor, Node, Region } from '../../core';
import { TextNode } from '../../nodes';
import { HtmlElementNode } from '../../nodes/html-element';
import { BlockRule } from './block';

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
        processor: Processor,
        options: {
            tagName: string,
            marker: string,
            markerMatcher?: CursorMatcher,
        }
    ) {
        super(processor);
        this.tagName = options.tagName;
        this.marker = options.marker;
    }

    protected skipMarker(cursor: Cursor) {
        cursor.skipString(this.marker);
    }

    protected isAtMarker(cursor: Cursor) {
        const start = cursor.position();
        this.skipMarker(cursor);
        const result = cursor.position() > start;
        cursor.set(start);
        return result;
    }

    protected scanBlock(cursor: Cursor): number | null {
        // Note: first marker of block is always matched against this.marker
        // (not via skipMarker/isAtMarker)
        if (!cursor.at(this.marker)) {
            return null;
        }
        while (cursor.hasCurrent()) {
            cursor.skipToEndOfBlock();
            const endOfBlock = cursor.position();
            cursor.skipBlankLines();
            // Find the end of this UL, checking nested and sibling sub-blocks
            const startOfLine = cursor.position();
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
        return cursor.position();
    }

    protected parseSubRegion(region: Region) {
        const regions: Region[] = [];
        const cursor = new Cursor(region);
        this.skipMarker(cursor);
        let hasBlocks = false;
        let start = cursor.position();
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
                const region = cursor.subRegion(start, cursor.position());
                regions.push(region);
                this.skipMarker(cursor);
                start = cursor.position();
            }
        }
        // Emit last li
        const lastRegion = cursor.subRegion(start, cursor.position());
        regions.push(lastRegion);
        const children = this.parseLiRegions(regions, hasBlocks);
        return new HtmlElementNode(lastRegion, children, this.tagName);
    }

    protected parseLiRegions(regions: Region[], hasBlocks: boolean): Node[] {
        const nodes = [];
        for (const region of regions) {
            const cursor = new Cursor(region);
            const li = hasBlocks ? this.parseBlockLi(cursor) : this.parseTerseLi(cursor);
            nodes.push(li);
        }
        return nodes;
    }

    protected parseTerseLi(cursor: Cursor): Node {
        const children: Node[] = [];
        // Terse lists start with inline markup and are scanned line-by-line,
        // looking for the lists inside with list parser.
        // Anything else should not exist, as per parseSubRegion's contract.
        const listParser = this.processor.getParser('list');
        // Always skip first new line
        let inlineStart = cursor.position();
        cursor.skipToEol().skipNewLine();
        while (cursor.hasCurrent()) {
            const pos = cursor.position();
            const list = listParser.parseSinglePass(cursor);
            if (list) {
                // Finish inline markup
                if (inlineStart !== pos) {
                    const region = cursor.subRegion(inlineStart, pos);
                    children.push(...this.parseInlineNodes(region));
                }
                // Append list
                children.push(list);
                // Start new inline fragment from here
                inlineStart = cursor.position();
            } else {
                cursor.skipToEol().skipBlankLines();
            }
        }
        if (inlineStart !== cursor.position()) {
            const region = cursor.subRegion(inlineStart, cursor.position());
            children.push(...this.parseInlineNodes(region));
        }
        return new HtmlElementNode(cursor.region, children, 'li');
    }

    protected parseBlockLi(cursor: Cursor): Node {
        const blockParser = this.processor.getParser('block');
        const ast = blockParser.parse(cursor.region);
        return new HtmlElementNode(cursor.region, ast.children, 'li');
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
