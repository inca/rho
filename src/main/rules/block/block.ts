import { Rule, Region, Node, Cursor } from '../../core';
import { SelectorNode } from '../../nodes';

export abstract class BlockRule extends Rule {
    indent: number = 0;

    protected abstract parseSubRegion(region: Region): Node | null;
    protected abstract scanBlock(cursor: Cursor): number | null;

    protected parseAt(cursor: Cursor): Node | null {
        cursor.skipBlankLines();
        this.countBlockIndent(cursor);
        const end = this.scanBlock(cursor.clone());
        if (end == null) {
            return null;
        }
        const region = cursor.readUntil(end);
        return this.parseSubRegion(region);
    }

    countBlockIndent(cursor: Cursor) {
        this.indent = 0;
        while (cursor.hasCurrent()) {
            if (cursor.at(' ')) {
                this.indent += 1;
                cursor.skip();
            } else {
                break;
            }
        }
    }

    parseInlineContent(region: Region): Node[] {
        const parser = this.processor.getParser('inline');
        const ast = parser.parse(region);
        return ast.children;
    }

    captureSelector(cursor: Cursor, allowMultiple: boolean = false): SelectorNode | null {
        return this.parseSelector(cursor.clone(), allowMultiple);
    }

    /**
     * Attempts to parse a selector expression in form {#id.class1.class2}
     * at the end of the current line.
     * If there is a selector expression, and all conditions are satisfied,
     * then it is returned and should subsequently be tainted
     * (i.e. excluded from string processing) by subsequent AST.
     * The cursor is discarded after this, so no need to preserve its position.
     */
    protected parseSelector(cursor: Cursor, allowMultiple: boolean = false): SelectorNode | null {
        while (cursor.hasCurrent() && !cursor.atNewLine()) {
            if (cursor.at('\\{')) {
                cursor.skip(2);
                continue;
            }
            if (!cursor.at('{')) {
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
                const nextSelector = this.parseSelector(cursor.clone(), allowMultiple);
                found = found || nextSelector != null;
            }
            // Finally, valid (and parsed) selector!
            if (found) {
                // Note: even though the region itself isn't used for rendering
                // (since we already have all the components right here),
                // it is super important to keep the region from `{` to `}` so that
                // block processors can properly taint them.
                const region = cursor.subRegion(start, cursor.pos);
                const node = new SelectorNode(region, id, classList);
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
