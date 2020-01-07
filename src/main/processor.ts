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
            new LiteralRule(this),
        ]);
    }

}
