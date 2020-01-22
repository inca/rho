import { Node } from '../core';

/**
 * General purpose node which emits text from specified subregion.
 */
export class TextNode extends Node {
    render() {
        return this.region.toString();
    }
}
