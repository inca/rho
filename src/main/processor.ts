import { Processor, DelegateRule } from './core';
import {
    PlainTextRule,
    BackslashEscapeRule,
    HtmlEntityRule,
    LiteralRule,
    EmRule,
    StrongRule,
    CodeSpanRule,
    FormulaRule,
    ListRule,
    NumberedListRule,
} from './rules';
import { ParagraphRule } from './rules/block/paragraph';

export class RhoProcessor extends Processor {

    constructor() {
        super();
        this.defineParser('block', () => [
            new DelegateRule(this, 'list'),
            new ParagraphRule(this),
        ]);
        this.defineParser('list', () => [
            new ListRule(this, { tagName: 'ul', marker: '* ' }),
            new ListRule(this, { tagName: 'ul', marker: '- ' }),
            new ListRule(this, { tagName: 'ol', marker: '#. ' }),
            new NumberedListRule(this, { tagName: 'ol', marker: '1. ' }),
        ]);
        this.defineParser('inline', () => [
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
        this.defineParser('code', () => [
            new PlainTextRule(this, { controlCharacters: '`&<>' }),
            new BackslashEscapeRule(this, { controlCharacters: '`' }),
            new HtmlEntityRule(this, { ignoreHtmlTags: true }),
            new LiteralRule(this),
        ]);
    }

}
