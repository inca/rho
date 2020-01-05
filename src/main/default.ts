import { Processor } from './processor';
import { HtmlEntityRule } from './rules/inline/html-entity';
import { PlainTextRule } from './rules/inline/plain-text';
import { EmRule } from './rules/inline/em';
import { StrongRule } from './rules/inline/strong';
import { SingleCharRule } from './rules/inline/single-char';

export class DefaultProcessor extends Processor {

    constructor() {
        super();

        this.defineParser('inline', [
            new HtmlEntityRule(this),
            new EmRule(this),
            new StrongRule(this),
            new PlainTextRule(this),
            new SingleCharRule(this),
        ]);
    }

}
