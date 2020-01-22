import { Cursor, Region, Node } from '../../core';
import { BlockRule } from './block';

export abstract class FencedBlockRule extends BlockRule {
    protected contentStart: number = -1;
    protected contentEnd: number = -1;

    abstract get marker(): string;
    protected abstract parseContent(region: Region): Node | null;

    protected scanBlock(cursor: Cursor): Region | null {
        const { marker } = this;
        if (!cursor.at(marker)) {
            return null;
        }
        const blockStart = cursor.pos;
        cursor.skip(marker.length).skipToEol().skipNewLine();
        this.contentStart = cursor.region.start + cursor.pos;
        this.contentEnd = -1;
        while (cursor.hasCurrent()) {
            cursor.skipSpaces(this.indent);
            if (!cursor.at(marker)) {
                cursor.skipToEol().skipNewLine();
                continue;
            }
            // We're at marker, but it has to be at the end of block
            const contentEnd = cursor.region.start + cursor.pos;
            cursor.skip(marker.length).skipSpaces();
            if (cursor.atBlankLine()) {
                cursor.skipNewLine();
                if (cursor.atBlankLine()) {
                    this.contentEnd = contentEnd;
                    break;
                }
            }
        }
        if (this.contentEnd === -1) {
            return null;
        }
        cursor.skipBlankLines();
        return cursor.subRegion(blockStart, cursor.pos);
    }

    protected parseSubRegion(region: Region) {
        const offset = this.contentStart - region.start;
        const length = this.contentEnd - this.contentStart;
        const contentRegion = region.subRegion(offset, offset + length);
        return this.parseContent(contentRegion);
    }

}
