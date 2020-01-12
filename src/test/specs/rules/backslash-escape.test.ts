import { RhoProcessor } from '../../../main/processor';
import { Cursor } from '../../../main/core';
import { BackslashEscapeRule } from '../../../main/rules';
import assert from 'assert';
import { TextNode } from '../../../main/nodes';

describe('BackslashEscapeRule', () => {

    const processor = new RhoProcessor();
    const rule = new BackslashEscapeRule(processor, { controlCharacters: '^!' });

    context('\\ + control character', () => {
        it('consumes backslash, emits control character verbatim', () => {
            const cursor = new Cursor('This \\^ that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert(node?.render(processor), '^');
            assert.equal(cursor.pos, 7);
        });
    });

    context('\\ + other character', () => {
        it('does not match', () => {
            const cursor = new Cursor('\\- random \\& stuff \\\\', 0);
            while (cursor.hasCurrent()) {
                const pos = cursor.pos;
                const node = rule.parse(cursor);
                assert(node == null);
                assert.equal(cursor.pos, pos);
                cursor.skip();
            }
        });
    });

});
