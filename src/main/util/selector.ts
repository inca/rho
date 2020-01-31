import { Region } from '../core';

export class Selector {
    constructor(
        readonly region: Region,
        public id: string,
        public classList: string[],
    ) {
    }

    render() {
        const buf: string[] = [];
        if (this.id) {
            buf.push(`id="${this.id}"`);
        }
        if (this.classList.length) {
            buf.push(`class="${this.classList.join(' ')}"`);
        }
        return buf.length ? ' ' + buf.join(' ') : '';
    }
}
