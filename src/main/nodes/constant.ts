import { Node, Region } from '../core';

/**
 * Similar to TextNode, but emits a hardcoded constant text,
 * instead of region.
 * Useful for overwriting regions.
 */
export class ConstantNode extends Node {

    constructor(
        region: Region,
        readonly text: string,
    ) {
        super(region);
    }

    render() {
        return this.text;
    }
}
