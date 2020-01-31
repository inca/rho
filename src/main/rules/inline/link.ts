import { Rule, Cursor, Node, constants, Region } from '../../core';
import { escapeHtml } from '../../util/escape';
import { MediaDef } from '../../util/media';
import { ContextWithMedia } from '../../context';

const {
    CHAR_SQUARE_LEFT,
    CHAR_SQUARE_RIGHT,
    CHAR_BACKSLASH,
    CHAR_EXCLAMATION,
    CHAR_PAREN_LEFT,
    CHAR_PAREN_RIGHT,
} = constants;

export class LinkRule extends Rule {

    constructor(
        readonly ctx: ContextWithMedia,
    ) {
        super(ctx);
    }

    protected parseAt(cursor: Cursor): Node | null {
        if (!cursor.atCode(CHAR_SQUARE_LEFT)) {
            return null;
        }
        const regionStart = cursor.pos;
        cursor.skip();
        const inlineParser = this.ctx.getParser('inline');
        const textStart = cursor.pos;
        const textEnd = this.findClosingMarker(cursor.clone());
        if (textEnd == null) {
            return null;
        }
        cursor.set(textEnd + 1);
        const textRegion = cursor.subRegion(textStart, textEnd);
        const { children } = inlineParser.parse(textRegion);
        return this.tryInlineLink(children, cursor, regionStart)
            || this.tryRefLink(children, cursor, regionStart);
    }

    protected findClosingMarker(cursor: Cursor): number | null {
        // Find matching square bracket, allowing nested media
        // with ![alt](href) or ![alt][id] syntaxes
        let nesting = 0;
        while (cursor.hasCurrent()) {
            if (cursor.atCode(CHAR_SQUARE_RIGHT) && !nesting) {
                // We're at correctly balanced closing bracket now
                return cursor.pos;
            }
            // Backslash escapes can be used to skip any square bracket in this context
            if (cursor.atCode(CHAR_BACKSLASH)) {
                cursor.skip(2);
                continue;
            }
            // Start of media: increase nesting
            if (cursor.atSeq(CHAR_EXCLAMATION, CHAR_SQUARE_LEFT)) {
                cursor.skip(2);
                nesting += 1;
                continue;
            }
            // The ][ part of ref media: don't increase nesting, just skip it
            if (cursor.atSeq(CHAR_SQUARE_RIGHT, CHAR_SQUARE_LEFT) && nesting > 0) {
                cursor.skip(2);
                continue;
            }
            // Closing nested bracket: decrease nesting
            if (cursor.atCode(CHAR_SQUARE_RIGHT)) {
                cursor.skip();
                nesting -= 1;
                continue;
            }
            cursor.skip();
        }
        return null;
    }

    protected tryInlineLink(children: Node[], cursor: Cursor, regionStart: number): Node | null {
        if (!cursor.atCode(CHAR_PAREN_LEFT)) {
            return null;
        }
        cursor.skip();
        const hrefStart = cursor.pos;
        const hrefEnd = cursor.scanSeq(CHAR_PAREN_RIGHT);
        if (hrefEnd == null) {
            return null;
        }
        cursor.set(hrefEnd + 1);
        const href = cursor.subRegion(hrefStart, hrefEnd).toString();
        const region = cursor.subRegion(regionStart, cursor.pos);
        const id = this.ctx.getNextInlineId();
        this.ctx.mediaIds.add(id);
        this.ctx.resolvedMedia.set(id, { href });
        return new LinkNode(region, children, id);
    }

    protected tryRefLink(children: Node[], cursor: Cursor, regionStart: number): Node | null {
        if (!cursor.atCode(CHAR_SQUARE_LEFT)) {
            return null;
        }
        cursor.skip();
        const idStart = cursor.pos;
        const idEnd = cursor.scanSeq(CHAR_SQUARE_RIGHT);
        if (idEnd == null) {
            return null;
        }
        cursor.set(idEnd + 1);
        const id = cursor.subRegion(idStart, idEnd).toString();
        const region = cursor.subRegion(regionStart, cursor.pos);
        this.ctx.mediaIds.add(id);
        return new LinkNode(region, children, id);
    }

}

export class HeadlessLinkRule extends Rule {

    constructor(
        readonly ctx: ContextWithMedia,
    ) {
        super(ctx);
    }

    protected parseAt(cursor: Cursor): Node | null {
        if (!(cursor.atCode(CHAR_SQUARE_LEFT) && cursor.atCode(CHAR_SQUARE_LEFT, 1))) {
            return null;
        }
        // Simply search for end marker, whatever is inside is an id
        const regionStart = cursor.pos;
        cursor.skip(2);
        const idStart = cursor.pos;
        const idEnd = cursor.scanSeq(CHAR_SQUARE_RIGHT, CHAR_SQUARE_RIGHT);
        if (idEnd == null) {
            return null;
        }
        cursor.set(idEnd + 2);
        const id = cursor.subRegion(idStart, idEnd).toString();
        cursor.skip(2);
        const region = cursor.subRegion(regionStart, cursor.pos);
        return new LinkNode(region, [], id, true);
    }

}

export class LinkNode extends Node {


    constructor(
        region: Region,
        children: Node[],
        public id: string,
        public isHeadless: boolean = false,
    ) {
        super(region, children);
    }

    resolveMedia(ctx: ContextWithMedia): MediaDef | null {
        return ctx.resolvedMedia.get(this.id) || null;
    }

    renderContent(ctx: ContextWithMedia): string {
        if (this.isHeadless) {
            const media = this.resolveMedia(ctx);
            return media?.title || '';
        }
        return ctx.renderChildren(this);
    }

    render(ctx: ContextWithMedia) {
        const media = this.resolveMedia(ctx);
        if (media == null) {
            return '';
        }
        let buffer = '<a';
        buffer += ` href="${escapeHtml(media.href)}"`;
        if (media.title) {
            buffer += ` title="${escapeHtml(media.title)}"`;
        }
        if (ctx.isExternalLink(media)) {
            buffer += ' target="_blank"';
        }
        buffer += '>';
        buffer += this.renderContent(ctx);
        buffer += '</a>';
        return buffer;
    }

}
