import { Cursor } from './cursor';
import { Node } from './node';
import { Region } from './region';
import { Exception } from './exception';
import { Context } from './context';

/**
 * Encapsulates a single parsing rule that facilitate the modular parsing system.
 *
 * Each parser (i.e. block, inline, code, etc) is configured
 * using a sequence of parsing rules. During parsing a cursor
 * over the region is created and each rule is sequentially called
 * on it, until one of the rules emits an AST Node.
 *
 * Each rule must follow a single most important contract:
 *
 *   A rule that returns Node must also modify the cursor.
 *   The rule that does not match must return `null`
 *   and in that the case cursor remains unmodified.
 *   (note: rule doesn't have to preserve cursor position
 *   as parser will throw them away anyway).
 *
 * Implementations must implement protected `parseAt` method.
 * Public `parse` method wraps `parseAt` and enforces the abovementioned contract.
 *
 * If `null` is returned by `parseAt`, the cursor position is reverted to where it was
 * this allows implementations to not care about preserving cursor position
 * when the rule does not match (this is especially useful in lookaheads).
 * However, if the rule does match, then cursor position must be 100% accurate, otherwise
 * next rules in chain will get an incorrect starting position.
 *
 * Disclaimer: modifying the state of cursor like that is widely known in the industry
 * as "side effect" and is generally frown upon. However, in this particular case
 * we found this design the most appropriate because:
 *
 *  - side effects are controlled: Cursor is created by Parser and is passed to a Rule,
 *    which means a tight contract between those two, and Cursor never leaks outside
 *  - composing the rules is natural this way: author of the rule can move Cursor arbitrarily
 *    back and forth to implement the scanning
 *  - performance: this approach also minimizes the number of objects created on each
 *    parsing pass, which is generally benefitial for GC
 */
export abstract class Rule {
    constructor(readonly ctx: Context) {}
    protected abstract parseAt(cursor: Cursor): Node | null;

    parse(cursor: Cursor): Node | null {
        const pos = cursor.pos;
        const node = this.parseAt(cursor);
        if (node == null) {
            cursor.set(pos);
        } else if (cursor.pos <= pos) {
            throw new Exception({
                code: 'InvalidRule',
                message: 'Parse rule must advance cursor position if it emits a node',
                details: {
                    rule: this,
                    cursor,
                }
            });
        }
        return node;
    }
}

/**
 * A convenience rule that delegates to another parser identified by `parserId`.
 */
export class DelegateRule extends Rule {

    constructor(
        ctx: Context,
        readonly parserId: string,
    ) {
        super(ctx);
    }

    parseAt(cursor: Cursor): Node | null {
        const parser = this.ctx.getParser(this.parserId);
        return parser.parseSinglePass(cursor);
    }

}
