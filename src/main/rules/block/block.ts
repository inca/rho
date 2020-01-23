import { Rule, Region, Node, Cursor, constants } from '../../core';
import { Selector } from '../../util/selector';

// Opt: enforces a limit on where opening curly brace { of
// selector expression may occur on the first line of the block.
// This prevents parser from walking through big blocks
// written in a soft-wrap style (i.e. where the entire block
// is written without line break characters), only to find out
// that there is no selector and it was a waste of processing.
// This also enforces a stylistic rule where, if selector
// is specified, it must start within conventional
// 120 characters from the start of the line.
const SELECTOR_LOOKUP_LIMIT = 120;

const {
    CHAR_SPACE,
    CHAR_TAB,
    CHAR_BACKSLASH,
    CHAR_CURLY_LEFT,
} = constants;

export abstract class BlockRule extends Rule {
    lineStartPos: number = 0;
    indent: number = 0;
    selector: Selector | null = null;

    protected abstract parseSubRegion(region: Region): Node | null;
    protected abstract scanBlock(cursor: Cursor): Region | null;

    protected allowsMultipleSelectors(): boolean {
        return false;
    }

    protected parseAt(cursor: Cursor): Node | null {
        cursor.skipBlankLines();
        this.countBlockIndent(cursor);
        let region = this.scanBlock(cursor.clone()) ;
        if (region == null) {
            return null;
        }
        // Cursor position is set to the end of the returned region;
        // this has to be calculated, since cursor position is relative to its own region,
        // whilst the new region boundaries are relative to the source string.
        cursor.set(region.end - cursor.region.start);
        this.selector = this.captureSelector(region, this.allowsMultipleSelectors());
        if (this.selector) {
            region = region.taintRegion(this.selector.region);
        }
        return this.parseSubRegion(region);
    }

    countBlockIndent(cursor: Cursor) {
        this.indent = 0;
        while (cursor.hasCurrent()) {
            const c = cursor.currentCode();
            if (c === CHAR_SPACE) {
                this.indent += 1;
                cursor.skip();
            } else if (c === CHAR_TAB) {
                this.indent += 4;
                cursor.skip();
            } else {
                break;
            }
        }
    }

    parseInlineContent(region: Region): Node[] {
        const parser = this.ctx.getParser('inline');
        const result: Node[] = [];
        const regions = region.untaint();
        for (const region of regions) {
            const ast = parser.parse(region);
            result.push(...ast.children);
        }
        return result;
    }

    captureSelector(region: Region, allowMultiple: boolean = false): Selector | null {
        return this.parseSelectorAt(new Cursor(region), allowMultiple);
    }

    /**
     * Attempts to parse a selector expression in form {#id.class1.class2}
     * at the end of the current line.
     * If there is a selector expression, and all conditions are satisfied,
     * then it is returned and should subsequently be tainted
     * (i.e. excluded from string processing) by subsequent AST.
     * The cursor is discarded after this, so no need to preserve its position.
     */
    protected parseSelectorAt(cursor: Cursor, allowMultiple: boolean = false): Selector | null {
        let i = 0;
        while (cursor.hasCurrent() && !cursor.atNewLine() && i < SELECTOR_LOOKUP_LIMIT) {
            i++;
            if (cursor.atCode(CHAR_BACKSLASH)) {
                cursor.skip(2);
                continue;
            }
            if (!cursor.atCode(CHAR_CURLY_LEFT)) {
                cursor.skip();
                continue;
            }
            // We're at {
            const start = cursor.pos;
            cursor.skip();
            const id = this.parseSelectorComponent('#', cursor) || '';
            const classList: string[] = [];
            while (true) {
                const cl = this.parseSelectorComponent('.', cursor);
                if (cl) {
                    classList.push(cl);
                    continue;
                }
                // TODO add support for ;styles
                break;
            }
            // Check for valid selector conditions, otherwise discard all the things
            // and continue from where we left
            if (!cursor.at('}')) {
                continue;
            }
            cursor.skip().skipSpaces();
            // It's a selector we're at the end of the line or cursor
            let found = cursor.atNewLine() || !cursor.hasCurrent();
            if (!found && allowMultiple) {
                // If multiple consequtive selectors are allowed (e.g. in lists),
                // we just recursively try parsing the next selector;
                // ultimately it should end with us either bumping into previous condition or not.
                const nextSelector = this.parseSelectorAt(cursor.clone(), allowMultiple);
                found = nextSelector != null;
            }
            // Finally, valid (and parsed) selector!
            if (found) {
                // Note: even though the region itself isn't used for rendering
                // (since we already have all the components right here),
                // it is super important to keep the region from `{` to `}` so that
                // block processors can properly taint them.
                const region = cursor.subRegion(start, cursor.pos);
                const node = new Selector(region, id, classList);
                return node;
            }
        }
        return null;
    }

    protected parseSelectorComponent(marker: string, cursor: Cursor): string | null {
        if (!cursor.at(marker)) {
            return null;
        }
        cursor.skip(marker.length);
        const start = cursor.pos;
        while (cursor.hasCurrent() && cursor.atIdentifier()) {
            cursor.skip();
        }
        const region = cursor.subRegion(start, cursor.pos);
        return region.length ? region.toString() : null;
    }

}
