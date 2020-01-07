import { Processor } from './core';
import { HtmlEntityRule } from './rules/inline/html-entity';
import { PlainTextRule } from './rules/inline/plain-text';
import { EmRule } from './rules/inline/em';
import { StrongRule } from './rules/inline/strong';
import { LiteralRule } from './rules/inline/literal';
import { BackslashEscapeRule } from './rules/inline/backslash-escape';

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
            new LiteralRule(this),
        ]);
    }

}
