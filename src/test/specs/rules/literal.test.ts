import { RhoProcessor } from '../../../main/processor';
import { Cursor } from '../../../main/core';
import { LiteralRule } from '../../../main/rules';
import assert from 'assert';
import { TextNode } from '../../../main/nodes/text';

describe('LiteralRule', () => {

    const processor = new RhoProcessor();
    const rule = new LiteralRule(processor);

    it('emits any character verbatim', () => {
        const cursor = new Cursor('\\- random \\\`~!@#$%^&*()-_+="<>{}[] stuff \\\\', 0);
        while (cursor.hasCurrent()) {
            const pos = cursor.position();
            const char = cursor.current();
            const node = rule.parse(cursor)!;
            assert(node instanceof TextNode);
            assert.equal(cursor.position(), pos + 1);
            assert.equal(node.region.start, pos);
            assert.equal(node.region.end, pos + 1);
            assert.equal(node.region.toString(), char);
            cursor.skip();
        }
    });

});
