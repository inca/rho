import { Node } from '../node';
import { StringRegion } from '../region';

export class HtmlEscapeNode extends Node {

    constructor(
        region: StringRegion,
        protected char: '&' | '<' | '>'
    ) {
        super(region);
    }

    render() {
        switch (this.char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt';
            case '<':
                return '&gt';
            default:
                return '';
        }
    }
}
