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
        const href = cursor.subRegion(hrefStart, hrefEnd).toString();
        const region = cursor.subRegion(regionStart, cursor.pos);
        return new InlineImageNode(region, href, text);
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
        this.addRefId(id);
        return new RefImageNode(region, id, text);
    }

    addRefId(id: string) {
        this.ctx.mediaIds.add(id);
    }

}

export abstract class ImageNode extends Node {
    abstract text: string;
    abstract resolveMedia(ctx: ContextWithMedia): MediaDef | null;

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
        if (media.title) {
            buffer += ` title="${escapeHtml(media.title)}"`;
        }
        buffer += '/>';
        return buffer;
    }

}

export class InlineImageNode extends ImageNode {

    constructor(
        region: Region,
        public href: string,
        public text: string,
    ) {
        super(region, []);
    }

    resolveMedia() {
        return {
            id: '',
            href: this.href,
            title: '',
        };
    }

}

export class RefImageNode extends ImageNode {

    constructor(
        region: Region,
        public id: string,
        public text: string,
    ) {
        super(region, []);
    }

    resolveMedia(ctx: ContextWithMedia) {
        return ctx.resolvedMedia.get(this.id) || null;
    }

}
