import { Node } from '../node';

export class TextNode extends Node {
    render() {
        return this.region.toString();
    }
}
