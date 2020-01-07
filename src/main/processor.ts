import { Processor } from './core';
import {
    PlainTextRule,
    BackslashEscapeRule,
    HtmlEntityRule,
    LiteralRule,
    EmRule,
    StrongRule,
    CodeSpanRule,
} from './rules';
import { FormulaRule } from './rules/inline/formula';

export class RhoProcessor extends Processor {

    constructor() {
        super();

        this.defineParser('code', [
            new PlainTextRule(this, { controlCharacters: '`&<>' }),
            new BackslashEscapeRule(this, { controlCharacters: '`' }),
            new HtmlEntityRule(this, { ignoreHtmlTags: true }),
            new LiteralRule(this),
        ]);

        this.defineParser('inline', [
            new PlainTextRule(this),
            new BackslashEscapeRule(this),
            new HtmlEntityRule(this),
            new EmRule(this),
            new StrongRule(this),
            new CodeSpanRule(this),
            new FormulaRule(this, { marker: '$$' }),
            new FormulaRule(this, { marker: '%%' }),
            new LiteralRule(this),
        ]);
    }

}
