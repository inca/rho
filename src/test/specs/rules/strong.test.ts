import { RhoProcessor } from '../../../main/processor';
import { Cursor } from '../../../main/core';
import { StrongRule, StrongNode } from '../../../main/rules';
import assert from 'assert';

describe('StrongRule', () => {

    const processor = new RhoProcessor();
    const rule = new StrongRule(processor);

    context('*', () => {

        context('closing * exists', () => {

            it('consumes STRONG till end marker', () => {
                const cursor = new Cursor('This *word* that', 5);
                const node = rule.parse(cursor);
                assert(node instanceof StrongNode);
                assert.equal(node?.render(processor), '<strong>word</strong>');
                assert.equal(cursor.position(), 11);
            });

            it('renders inline markup inside', () => {
                const cursor = new Cursor('*a _&_ b*', 0);
                const node = rule.parse(cursor);
                assert(node instanceof StrongNode);
                assert.equal(node?.render(processor), '<strong>a <em>&amp;</em> b</strong>');
                assert(!cursor.hasCurrent());
            });

        });

        context('closing * does not exist', () => {
            it('does not match', () => {
                const cursor = new Cursor('This *and that', 5);
                const node = rule.parse(cursor);
                assert(node == null);
                assert.equal(cursor.position(), 5);
            });
        });
    });

    context('other character', () => {
        it('does not match', () => {
            const cursor = new Cursor('\\- random \\& stuff \\\\', 0);
            while (cursor.hasCurrent()) {
                const pos = cursor.position();
                const node = rule.parse(cursor);
                assert(node == null);
                assert.equal(cursor.position(), pos);
                cursor.skip();
            }
        });
    });

});
