import { Processor, DelegateRule, constants } from './core';
import {
    PlainTextRule,
    BackslashEscapeRule,
    HtmlEntityRule,
    VerbatimRule,
    EmRule,
    StrongRule,
    CodeSpanRule,
    FormulaRule,
    ListRule,
    NumberedListRule,
    StrikeRule,
    HtmlTagRule,
    HtmlCommentRule,
    DivBlockRule,
    HtmlBlockRule,
} from './rules';
import { ParagraphRule } from './rules/block/paragraph';
import { HeadingRule } from './rules/block/heading';
import { CodeBlockRule } from './rules/block/code-block';

const {
    CHAR_AMP,
    CHAR_LT,
    CHAR_GT,
    CHAR_BACKSLASH,
    CHAR_BACKTICK,
} = constants;

export class RhoProcessor extends Processor {

    constructor() {
        super();
        this.setMainParser('block');
        this.defineParser('block', () => [
            new HeadingRule(this, { minLevel: 1, maxLevel: 6 }),
            new DelegateRule(this, 'list'),
            new CodeBlockRule(this),
            new DivBlockRule(this),
            new HtmlBlockRule(this),
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
            new HtmlTagRule(this),
            new HtmlCommentRule(this),
            new HtmlEntityRule(this),
            new EmRule(this),
            new StrongRule(this),
            new StrikeRule(this),
            new CodeSpanRule(this),
            new FormulaRule(this, { marker: '$$' }),
            new FormulaRule(this, { marker: '%%' }),
            new VerbatimRule(this),
        ]);
        this.defineParser('code', () => [
            new PlainTextRule(this, {
                controlCharacters: [
                    CHAR_BACKTICK,
                    CHAR_AMP,
                    CHAR_LT,
                    CHAR_GT,
                    CHAR_BACKSLASH,
                ]
            }),
            new BackslashEscapeRule(this, {
                controlCharacters: [CHAR_BACKTICK]
            }),
            new HtmlEntityRule(this),
            new VerbatimRule(this),
        ]);
    }

}
