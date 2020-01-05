import { Processor } from './processor';
import { HtmlEntityRule } from './rules/inline/html-entity';
import { PlainTextRule } from './rules/inline/plain-text';
import { EmRule } from './rules/inline/em';
import { StrongRule } from './rules/inline/strong';
import { LiteralRule } from './rules/inline/literal';
import { Config } from './config';
import { BackslashEscapeRule } from './rules/inline/backslash-escape';

export class DefaultProcessor extends Processor {

    constructor(config: Partial<Config> = {}) {
        super(config);

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
