import { Cursor, Region, Node } from '../../core';
import { BlockRule } from './block';

export abstract class FencedBlockRule extends BlockRule {
    protected contentStart: number = 0;
    protected contentEnd: number = 0;

    abstract get marker(): string;
    protected abstract parseContent(region: Region): Node | null;

    protected scanBlock(cursor: Cursor): Region | null {
        const { marker } = this;
        if (!cursor.at(marker)) {
            return null;
        }
        const blockStart = cursor.pos;
        cursor.skip(marker.length).skipToEol();
        this.contentStart = cursor.pos;
        const end = cursor.indexOfEscaped(marker);
        if (end == null) {
            return null;
        }
        this.contentEnd = end;
        cursor
            .set(end)
            .skip(marker.length)
            .skipBlankLines();
        return cursor.subRegion(blockStart, cursor.pos);
    }

    protected parseSubRegion(region: Region) {
        const offset = this.contentStart - region.start;
        const length = this.contentEnd - this.contentStart;
        return this.parseContent(region.subRegion(offset, offset + length));
    }

}
