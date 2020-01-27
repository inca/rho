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
        const codeParser = this.ctx.getParser('inline');
        const textStart = cursor.pos;
        // Find matching square bracket, allowing nested images
        // with ![alt](href) or ![alt][id] syntaxes
        let nested = 0;
        while (cursor.hasCurrent()) {
            if (cursor.atCode(CHAR_SQUARE_RIGHT) && nested === 0) {
                // We're at correctly balanced closing bracket now,
                // so it can be either (href) or [id] after that
                const textRegion = cursor.subRegion(textStart, cursor.pos);
                const { children } = codeParser.parse(textRegion);
                cursor.skip();
                return this.tryInlineLink(children, cursor, regionStart)
                    || this.tryRefLink(children, cursor, regionStart);
            }
            // Backslash escapes can be used to skip any square bracket in this context
            if (cursor.atCode(CHAR_BACKSLASH)) {
                cursor.skip(2);
                continue;
            }
            // Start of image
            if (cursor.atCode(CHAR_EXCLAMATION) && cursor.atCode(CHAR_SQUARE_LEFT, 1)) {
                cursor.skip(2);
                nested += 1;
                continue;
            }
            // Closing nested bracket, reduce nesting
            // Note: this may produce incorrect results, occasionally
            if (cursor.atCode(CHAR_SQUARE_RIGHT)) {
                cursor.skip();
                nested -= 1;
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
        const start = cursor.pos;
        while (cursor.hasCurrent()) {
            if (cursor.atCode(CHAR_BACKSLASH)) {
                cursor.skip(2);
                continue;
            }
            if (cursor.atCode(CHAR_PAREN_RIGHT)) {
                const href = cursor.subRegion(start, cursor.pos).toString();
                cursor.skip();
                const region = cursor.subRegion(regionStart, cursor.pos);
                return new InlineLinkNode(region, children, href);
            }
            cursor.skip();
        }
        return null;
    }

    protected tryRefLink(children: Node[], cursor: Cursor, regionStart: number): Node | null {
        if (!cursor.atCode(CHAR_SQUARE_LEFT)) {
            return null;
        }
        cursor.skip();
        const start = cursor.pos;
        while (cursor.hasCurrent()) {
            if (cursor.atCode(CHAR_BACKSLASH)) {
                cursor.skip(2);
                continue;
            }
            if (cursor.atCode(CHAR_SQUARE_RIGHT)) {
                const id = cursor.subRegion(start, cursor.pos).toString();
                cursor.skip();
                const region = cursor.subRegion(regionStart, cursor.pos);
                this.addRefId(id);
                return new RefLinkNode(region, children, id);
            }
            cursor.skip();
        }
        return null;
    }

    addRefId(id: string) {
        this.ctx.mediaIds.add(id);
    }

}

export abstract class LinkNode extends Node {

    abstract resolveMedia(ctx: ContextWithMedia): MediaDef | null;

    render(ctx: ContextWithMedia) {
        const media = this.resolveMedia(ctx);
        if (media == null) {
            // Unresolved links are omitted by default,
            // but can be changed to verbatim.
            return '';
        }
        const content = ctx.renderChildren(this);
        let buffer = '<a';
        buffer += ` href="${escapeHtml(media.href)}"`;
        if (media.title) {
            buffer += ` title="${escapeHtml(media.title)}"`;
        }
        if (ctx.isExternalLink(media)) {
            buffer += ' target="_blank"';
        }
        buffer += '>';
        buffer += content;
        buffer += '</a>';
        return buffer;
    }

}

export class InlineLinkNode extends LinkNode {

    constructor(
        region: Region,
        children: Node[],
        public href: string,
    ) {
        super(region, children);
    }

    resolveMedia() {
        return {
            id: '',
            href: this.href,
            title: '',
        };
    }

}

export class RefLinkNode extends LinkNode {

    constructor(
        region: Region,
        children: Node[],
        public id: string,
    ) {
        super(region, children);
    }

    resolveMedia(ctx: ContextWithMedia) {
        return ctx.resolvedMedia.get(this.id) || null;
    }

}
