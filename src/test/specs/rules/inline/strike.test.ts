import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    StrikeRule,
    StrikeNode,
} from '../../../../main';

describe('StrikeRule', () => {

    const processor = new RhoProcessor();
    const rule = new StrikeRule(processor);

    context('~ pair', () => {

        it('consumes S till end marker', () => {
            const cursor = new Cursor('This ~word~ that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof StrikeNode);
            assert.equal(node?.render(processor), '<s>word</s>');
            assert.equal(cursor.pos, 11);
        });

        it('renders inline markup inside', () => {
            const cursor = new Cursor('~a *&* b~', 0);
            const node = rule.parse(cursor);
            assert(node instanceof StrikeNode);
            assert.equal(node?.render(processor), '<s>a <strong>&amp;</strong> b</s>');
            assert(!cursor.hasCurrent());
        });
    });

    context('singular ~', () => {
        it('does not match', () => {
            const cursor = new Cursor('This ~and that', 5);
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
