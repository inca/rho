import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    CodeSpanRule,
    CodeSpanNode,
} from '../../../../main';

describe('CodeSpanRule', () => {

    const processor = new RhoProcessor();
    const rule = new CodeSpanRule(processor);

    context('` pair', () => {

        it('consumes code span till end marker', () => {
            const cursor = new Cursor('This `code` that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof CodeSpanNode);
            assert.equal(cursor.pos, 11);
        });

        it('escapes <', () => {
            const cursor = new Cursor('`a < b`', 0);
            const node = rule.parse(cursor);
            assert(node instanceof CodeSpanNode);
            assert(!cursor.hasCurrent());
            assert(node?.render(processor), '<code>a &lt; b</code>');
        });

        it('escapes >', () => {
            const cursor = new Cursor('`a > b`', 0);
            const node = rule.parse(cursor);
            assert(node instanceof CodeSpanNode);
            assert(!cursor.hasCurrent());
            assert(node?.render(processor), '<code>a &gt; b</code>');
        });

        it('escapes &', () => {
            const cursor = new Cursor('`a && b`', 0);
            const node = rule.parse(cursor);
            assert(node instanceof CodeSpanNode);
            assert(!cursor.hasCurrent());
            assert(node?.render(processor), '<code>a &amp;&amp; b</code>');
        });

        it('escapes html tags', () => {
            const cursor = new Cursor('`<a>link</a>`', 0);
            const node = rule.parse(cursor);
            assert(node instanceof CodeSpanNode);
            assert(!cursor.hasCurrent());
            assert(node?.render(processor), '<code>&lt;a&gt;link&lt;/a&gt;</code>');
        });

        it('escapes ` with backslash', () => {
            const cursor = new Cursor('`a \\` b`', 0);
            const node = rule.parse(cursor);
            assert(node instanceof CodeSpanNode);
            assert(!cursor.hasCurrent());
            assert(node?.render(processor), '<code>a ` b</code>');
        });

    });

    context('single `', () => {
        it('does not match', () => {
            const cursor = new Cursor('This `ol that', 5);
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
