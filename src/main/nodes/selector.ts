import { Node, Region } from '../core';

export class SelectorNode extends Node {
    constructor(
        region: Region,
        public id: string,
        public classList: string[],
    ) {
        super(region, []);
    }

    render() {
        const buf: string[] = [];
        if (this.id) {
            buf.push(`id="${this.id}"`);
        }
        if (this.classList.length) {
            buf.push(`class="${this.classList.join(' ')}"`);
        }
        return ' ' + buf.join(' ');
    }
}
