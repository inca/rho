import { Rule, Cursor, Node, constants, Region } from '../../core';
import { escapeHtml } from '../../util/escape';
import { MediaDef } from '../../util/media';
import { ContextWithMedia } from '../../context';

const {
    CHAR_SQUARE_LEFT,
    CHAR_SQUARE_RIGHT,
    CHAR_EXCLAMATION,
    CHAR_PAREN_LEFT,
    CHAR_PAREN_RIGHT,
} = constants;

export class ImageRule extends Rule {

    constructor(
        readonly ctx: ContextWithMedia,
    ) {
        super(ctx);
    }

    protected parseAt(cursor: Cursor): Node | null {
        if (!(cursor.atCode(CHAR_EXCLAMATION) && cursor.atCode(CHAR_SQUARE_LEFT, 1))) {
            return null;
        }
        const regionStart = cursor.pos;
        cursor.skip(2);
        const textStart = cursor.pos;
        const textEnd = cursor.scanSeq(CHAR_SQUARE_RIGHT);
        if (textEnd == null) {
            return null;
        }
        cursor.set(textEnd + 1);
        const text = cursor.subRegion(textStart, textEnd).toString();
        return this.tryInlineImg(cursor, text, regionStart)
            || this.tryRefImg(cursor, text, regionStart);
    }

    protected tryInlineImg(cursor: Cursor, text: string, regionStart: number): Node | null {
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
        const id = this.ctx.getNextInlineId();
        const href = cursor.subRegion(hrefStart, hrefEnd).toString();
        const region = cursor.subRegion(regionStart, cursor.pos);
        this.ctx.mediaIds.add(id);
        this.ctx.resolvedMedia.set(id, { href });
        return new ImageNode(region, id, text);
    }

    protected tryRefImg(cursor: Cursor, text: string, regionStart: number): Node | null {
        if (!cursor.atCode(CHAR_SQUARE_LEFT)) {
            return null;
        }
        cursor.skip();
        const idStart = cursor.pos;
        const idEnd = cursor.scanSeq(CHAR_SQUARE_RIGHT);
        if (idEnd == null) {
            return null;
        }
        const id = cursor.subRegion(idStart, idEnd).toString();
        cursor.skip();
        const region = cursor.subRegion(regionStart, cursor.pos);
        this.ctx.mediaIds.add(id);
        return new ImageNode(region, id, text);
    }

}

export class ImageNode extends Node {

    constructor(
        region: Region,
        public id: string,
        public text: string = '',
    ) {
        super(region, []);
    }

    resolveMedia(ctx: ContextWithMedia): MediaDef | null {
        return ctx.resolvedMedia.get(this.id) || null;
    }

    render(ctx: ContextWithMedia) {
        const media = this.resolveMedia(ctx);
        if (media == null) {
            return '';
        }
        let buffer = '<img';
        buffer += ` src="${escapeHtml(media.href)}"`;
        if (this.text) {
            buffer += ` alt="${escapeHtml(this.text)}"`;
        }
        buffer += ` title="${escapeHtml(media.title || this.text)}"`;
        buffer += '/>';
        return buffer;
    }

}
