import { Processor, Node } from '../core';

export class RootNode extends Node {
    render(processor: Processor) {
        return this.renderChildren(processor);
    }
}
