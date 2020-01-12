import { RhoProcessor } from '../../../main/processor';
import { Cursor } from '../../../main/core';
import { PlainTextRule } from '../../../main/rules';
import assert from 'assert';
import { TextNode } from '../../../main/nodes/text';

describe('PlainTextRule', () => {

    const processor = new RhoProcessor();
    const rule = new PlainTextRule(processor, { controlCharacters: '^' });

    it('emits a region till next control character', () => {
        const cursor = new Cursor('Hello ^ World!', 0);
        const node = rule.parse(cursor)!;
        assert(node instanceof TextNode);
        assert(node.render(processor), 'Hello ');
        assert.equal(cursor.pos, 6);
    });

});
