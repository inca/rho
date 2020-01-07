import { Node } from '../core';

export class SelectorNode extends Node {
    id: string = '';
    classList: string[] = [];

    render() {
        const buf: string[] = [];
        if (this.id) {
            buf.push(`id="${this.id}"`);
        }
        if (this.classList.length) {
            buf.push(`class="${this.classList.join(' ')}"`);
        }
        return buf.join(' ');
    }
}
