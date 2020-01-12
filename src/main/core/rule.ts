import { Cursor } from './cursor';
import { Node } from './node';
import { Processor } from './processor';
import { Region } from './region';
import { Exception } from './exception';

/**
 * Encapsulates a single parsing rule to facilitate the modular parsing system.
 *
 * Each parser (i.e. block, inline, code, etc) is configured
 * using a sequence of parsing rules. During parsing a cursor
 * over the region is created and each rule is sequentially called
 * on it, until one of the rules emits an AST Node.
 *
 * Each rule must follow a single most important contract:
 *
 *   A rule that returns Node must also modify the cursor.
 *   Conversely, rule that does not match must return `null`.
 *
 * Implementations must implement protected `parseAt` method.
 * Public `parse` method wraps `parseAt` and enforces the abovementioned contract.
 *
 * If `null` is returned by `parseAt`, the cursor position is reverted to where it was
 * before attempting to parse — this allows implementations to not care about
 * preserving cursor position when the rule does not match (this is especially useful in lookaheads).
 * However, if the rule does match, then cursor position must be 100% accurate, otherwise
 * next rules in chain will get incorrect cursor.
 *
 * Note: modifying the state of cursor like that is widely known in the industry
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
    constructor(readonly processor: Processor) {}
    protected abstract parseAt(cursor: Cursor): Node | null;

    parse(cursor: Cursor): Node | null {
        const pos = cursor.position();
        const node = this.parseAt(cursor);
        if (node == null) {
            cursor.set(pos);
        } else if (cursor.position() <= pos) {
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

export class DelegateRule extends Rule {

    constructor(
        processor: Processor,
        readonly parserId: string,
    ) {
        super(processor);
    }

    parseAt(cursor: Cursor): Node | null {
        const parser = this.processor.getParser(this.parserId);
        return parser.parseSinglePass(cursor);
    }

}

export abstract class BracketRule extends Rule {
    abstract openMarker: string;
    abstract closeMarker: string;

    protected abstract parseSubRegion(region: Region): Node;

    protected parseAt(cursor: Cursor): Node | null {
        const { openMarker, closeMarker } = this;
        if (!cursor.at(openMarker)) {
            return null;
        }
        cursor.skip(openMarker.length);
        // Look for closeMarker, ignoring backslashes
        const end = cursor.lookahead(cur => {
            while (cur.hasCurrent()) {
                if (cur.at('\\')) {
                    cur.skip(2);
                }
                if (cur.at(closeMarker)) {
                    return cur.position();
                }
                cur.skip();
            }
            return null;
        });
        if (end == null) {
            return null;
        }
        const region = cursor.readUntil(end);
        cursor.skip(closeMarker.length);
        return this.parseSubRegion(region);
    }
}
