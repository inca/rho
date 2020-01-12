import { RhoProcessor } from '../../../main/processor';
import { Cursor } from '../../../main/core';
import { EmRule, EmNode } from '../../../main/rules';
import assert from 'assert';

describe('EmRule', () => {

    const processor = new RhoProcessor();
    const rule = new EmRule(processor);

    context('_ pair', () => {

        it('consumes EM till end marker', () => {
            const cursor = new Cursor('This _word_ that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof EmNode);
            assert.equal(node?.render(processor), '<em>word</em>');
            assert.equal(cursor.pos, 11);
        });

        it('renders inline markup inside', () => {
            const cursor = new Cursor('_a *&* b_', 0);
            const node = rule.parse(cursor);
            assert(node instanceof EmNode);
            assert.equal(node?.render(processor), '<em>a <strong>&amp;</strong> b</em>');
            assert(!cursor.hasCurrent());
        });
    });

    context('singular _', () => {
        it('does not match', () => {
            const cursor = new Cursor('This _and that', 5);
            const node = rule.parse(cursor);
            assert(node == null);
            assert.equal(cursor.pos, 5);
        });
    });

    context('other character', () => {
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
