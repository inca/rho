import { Processor } from '../processor';
import { Node } from '../node';

export class RootNode extends Node {
    render(processor: Processor) {
        return this.renderChildren(processor);
    }
}
