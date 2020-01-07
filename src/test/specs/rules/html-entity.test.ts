import assert from 'assert';
import { Cursor } from '../../../main/core';
import { HtmlEntityRule, HtmlEscapeNode } from '../../../main/rules/inline/html-entity';
import { TextNode } from '../../../main/nodes/text';
import { RhoProcessor } from '../../../main/processor';

const processor = new RhoProcessor();

describe('HtmlEntityRule', () => {

    const rule = new HtmlEntityRule(processor);

    context('&', () => {

        it('emits &amp; for standalone ampersand character', () => {
            const cursor = new Cursor('This & that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof HtmlEscapeNode);
            assert(node?.render(processor), '&amp;');
            assert.equal(cursor.position(), 6);
        });

        it('emits ascii entity reference', () => {
            const cursor = new Cursor('100&percnt; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert(node?.render(processor), '&percnt;');
            assert.equal(cursor.position(), 11);
        });

        it('emits decimal entity reference', () => {
            const cursor = new Cursor('100&#37; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert(node?.render(processor), '&#37;');
            assert.equal(cursor.position(), 8);
        });

        it('emits hexadecimal entity reference', () => {
            const cursor = new Cursor('100&#x025; legit', 3);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert(node?.render(processor), '&#x025;');
            assert.equal(cursor.position(), 10);
        });

    });

    context('<', () => {

        it('does not match opening html tag', () => {
            const cursor = new Cursor('Click <a>here</a> to continue', 6);
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert.equal(node, null);
            assert.equal(cursor.position(), 6);
        });

        it('does not match closing html tag', () => {
            const cursor = new Cursor('Click <a>here</a> to continue', 13);
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert.equal(node, null);
            assert.equal(cursor.position(), 13);
        });

        it('does not match self-closing html tag', () => {
            const cursor = new Cursor('<input/>');
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert.equal(node, null);
            assert.equal(cursor.position(), 0);
        });

        it('emits &lt; when standalone', () => {
            const cursor = new Cursor('a < b', 2);
            assert.equal(cursor.current(), '<');
            const node = rule.parse(cursor);
            assert(node instanceof HtmlEscapeNode);
            assert(node?.render(processor), '&lt;');
            assert.equal(cursor.position(), 3);
        });

    });

    context('>', () => {
        it('emits &gt;', () => {
            const cursor = new Cursor('a > b', 2);
            assert.equal(cursor.current(), '>');
            const node = rule.parse(cursor);
            assert(node instanceof HtmlEscapeNode);
            assert.equal(node?.render(processor), '&gt;');
            assert.equal(cursor.position(), 3);
        });
    });

});
