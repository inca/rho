import { Rule, Cursor, Node, constants, Context } from '../../core';
import { LiteralNode } from '../../nodes';
import { RhoOptions } from '../../options';

const {
    CHAR_QUOTE_SINGLE,
    CHAR_QUOTE_DOUBLE,
} = constants;

export class TypographicsRule extends Rule {

    constructor(ctx: Context, protected options: RhoOptions) {
        super(ctx);
    }

    protected parseAt(cursor: Cursor): Node | null {
        const code = cursor.currentCode();
        switch (code) {
            case CHAR_QUOTE_SINGLE: {
                const quoteChar = this.isLeftQuote(cursor) ?
                    this.options.leftSingleQuote : this.options.rightSingleQuote;
                const region = cursor.readForward(1);
                return new LiteralNode(region, quoteChar);
            }
            case CHAR_QUOTE_DOUBLE: {
                const quoteChar = this.isLeftQuote(cursor) ?
                    this.options.leftDoubleQuote : this.options.rightDoubleQuote;
                const region = cursor.readForward(1);
                return new LiteralNode(region, quoteChar);
            }
        }
        return null;
    }

    isLeftQuote(cursor: Cursor) {
        const whitespaceBefore = cursor.pos === 0 ||
            cursor.clone().skip(-1).atWhitespace();
        const whitespaceAfter = cursor.clone().skip(1).atWhitespace();
        return whitespaceBefore && !whitespaceAfter;
    }

}
