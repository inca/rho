import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    HtmlEntityRule,
    HtmlEscapeNode,
    TextNode,
} from '../../../../main';

describe('HtmlEntityRule', () => {

    const processor = new RhoProcessor();
    const rule = new HtmlEntityRule(processor);

    context('&', () => {

        it('emits &amp; for standalone ampersand character', () => {
            const cursor = new Cursor('This & that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof HtmlEscapeNode);
            assert(node?.render(processor), '&amp;');
            assert.equal(cursor.pos, 6);
        });

        it('emits ascii entity reference', () => {
            const cursor = new Cursor('100&percnt; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert(node?.render(processor), '&percnt;');
            assert.equal(cursor.pos, 11);
        });

        it('emits decimal entity reference', () => {
            const cursor = new Cursor('100&#37; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert(node?.render(processor), '&#37;');
            assert.equal(cursor.pos, 8);
        });

        it('emits hexadecimal entity reference', () => {
            const cursor = new Cursor('100&#x025; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert(node?.render(processor), '&#x025;');
            assert.equal(cursor.pos, 10);
        });

    });

    context('<', () => {

        it('does not match opening html tag', () => {
            const cursor = new Cursor('Click <a>here</a> to continue', 6);
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert.equal(node, null);
            assert.equal(cursor.pos, 6);
        });

        it('does not match closing html tag', () => {
            const cursor = new Cursor('Click <a>here</a> to continue', 13);
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert.equal(node, null);
            assert.equal(cursor.pos, 13);
        });

        it('does not match self-closing html tag', () => {
            const cursor = new Cursor('<input/>');
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert.equal(node, null);
            assert.equal(cursor.pos, 0);
        });

        it('emits &lt; when standalone', () => {
            const cursor = new Cursor('a < b', 2);
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert(node instanceof HtmlEscapeNode);
            assert(node?.render(processor), '&lt;');
            assert.equal(cursor.pos, 3);
        });

    });

    context('>', () => {
        it('emits &gt;', () => {
            const cursor = new Cursor('a > b', 2);
            assert.equal(cursor.current(), '>');
            const node = rule.parse(cursor);
            assert(node instanceof HtmlEscapeNode);
            assert.equal(node?.render(processor), '&gt;');
            assert.equal(cursor.pos, 3);
        });
    });

});