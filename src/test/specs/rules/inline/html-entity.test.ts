import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    HtmlEntityRule,
    TextNode,
} from '../../../../main';

describe('HtmlEntityRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new HtmlEntityRule(ctx);

    context('&', () => {

        it('emits &amp; for standalone ampersand character', () => {
            const cursor = new Cursor('This & that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '&amp;');
            assert.equal(cursor.pos, 6);
        });

        it('emits ascii entity reference', () => {
            const cursor = new Cursor('100&percnt; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '&percnt;');
            assert.equal(cursor.pos, 11);
        });

        it('emits decimal entity reference', () => {
            const cursor = new Cursor('100&#37; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '&#37;');
            assert.equal(cursor.pos, 8);
        });

        it('emits hexadecimal entity reference', () => {
            const cursor = new Cursor('100&#x025; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '&#x025;');
            assert.equal(cursor.pos, 10);
        });

    });

    context('<', () => {
        it('emits &lt;', () => {
            const cursor = new Cursor('a < b', 2);
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '&lt;');
            assert.equal(cursor.pos, 3);
        });
    });

    context('>', () => {
        it('emits &gt;', () => {
            const cursor = new Cursor('a > b', 2);
            assert.equal(cursor.current(), '>');
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '&gt;');
            assert.equal(cursor.pos, 3);
        });
    });

});
