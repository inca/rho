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
    HeadingRule,
    CodeBlockRule,
    ParagraphRule,
    LinkRule,
    HeadlessLinkRule,
    ImageRule,
} from './rules';
import { RhoOptions, RHO_DEFAULT_OPTIONS } from './options';
import { RhoContext } from './context';

const {
    CHAR_AMP,
    CHAR_LT,
    CHAR_GT,
    CHAR_BACKSLASH,
    CHAR_BACKTICK,
} = constants;

export class RhoProcessor extends Processor {
    options: RhoOptions;

    constructor(options: Partial<RhoOptions> = {}) {
        super();
        this.options = { ...RHO_DEFAULT_OPTIONS, ...options };
        this.setMainParser('block');
        this.defineParser('block', ctx => [
            new HeadingRule(ctx, { minLevel: 1, maxLevel: 6 }),
            new DelegateRule(ctx, 'list'),
            new CodeBlockRule(ctx),
            new DivBlockRule(ctx),
            new HtmlBlockRule(ctx),
            new ParagraphRule(ctx),
        ]);
        this.defineParser('list', ctx => [
            new ListRule(ctx, { tagName: 'ul', marker: '* ' }),
            new ListRule(ctx, { tagName: 'ul', marker: '- ' }),
            new ListRule(ctx, { tagName: 'ol', marker: '#. ' }),
            new NumberedListRule(ctx, { tagName: 'ol', marker: '1. ' }),
        ]);
        this.defineParser('inline', ctx => [
            new PlainTextRule(ctx),
            new BackslashEscapeRule(ctx),
            new HtmlTagRule(ctx),
            new HtmlCommentRule(ctx),
            new HtmlEntityRule(ctx),
            new EmRule(ctx),
            new StrongRule(ctx),
            new StrikeRule(ctx),
            new CodeSpanRule(ctx),
            new FormulaRule(ctx, { marker: '$$' }),
            new FormulaRule(ctx, { marker: '%%' }),
            new LinkRule(ctx as RhoContext),
            new HeadlessLinkRule(ctx as RhoContext),
            new ImageRule(ctx as RhoContext),
            new VerbatimRule(ctx),
        ]);
        this.defineParser('code', ctx => [
            new PlainTextRule(ctx, {
                controlCharacters: [
                    CHAR_BACKTICK,
                    CHAR_AMP,
                    CHAR_LT,
                    CHAR_GT,
                    CHAR_BACKSLASH,
                ]
            }),
            new BackslashEscapeRule(ctx, {
                controlCharacters: [CHAR_BACKTICK]
            }),
            new HtmlEntityRule(ctx),
            new VerbatimRule(ctx),
        ]);
    }

    createContext() {
        return new RhoContext(this);
    }

}
