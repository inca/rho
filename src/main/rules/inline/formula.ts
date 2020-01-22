import {
    BracketRule,
    Node,
    Processor,
    Region,
    Parser,
    constants,
} from '../../core';
import { PlainTextRule } from './plain-text';
import { HtmlEntityRule } from './html-entity';
import { VerbatimRule } from './verbatim';

const { CHAR_LT, CHAR_GT, CHAR_AMP } = constants;

/**
 * Emits MathJax-friendly formula enclosed in $$ and %% markers.
 * Processing is similar to code spans, except that backslashes are emitted as-is.
 * Markers are emitted too.
 */
export class FormulaRule extends BracketRule {
    marker: string;
    parser: Parser;

    constructor(
        processor: Processor,
        options: {
            marker: string,
        },
    ) {
        super(processor);
        this.marker = options.marker;
        this.parser = new Parser(processor, [
            new PlainTextRule(processor, {
                controlCharacters: [
                    CHAR_AMP,
                    CHAR_LT,
                    CHAR_GT,
                ]
            }),
            new HtmlEntityRule(processor),
            new VerbatimRule(processor),
        ]);
    }

    get openMarker() {
        return this.marker;
    }

    get closeMarker() {
        return this.marker;
    }

    protected parseSubRegion(region: Region): Node {
        const root = this.parser.parse(region);
        return new FormulaNode(region, root.children, this.marker);
    }
}

export class FormulaNode extends Node {

    constructor(
        region: Region,
        children: Node[],
        readonly marker: string
    ) {
        super(region, children);
    }

    render(processor: Processor) {
        return `${this.marker}${this.renderChildren(processor)}${this.marker}`;
    }
}
