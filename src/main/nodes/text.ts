import { Node } from '../core';

export class TextNode extends Node {
    render() {
        return this.region.toString();
    }
}
