import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    HtmlTagRule,
    TextNode,
} from '../../../../main';

describe('HtmlTagRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new HtmlTagRule(ctx);

    context('opening tag, no attributes', () => {
        it('emits tag', () => {
            const cursor = new Cursor('This <a> that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '<a>');
            assert.equal(cursor.pos, 8);
        });
    });

    context('opening tag, with attributes', () => {
        it('emits tag', () => {
            const cursor = new Cursor('This <a href="about:blank"> that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '<a href="about:blank">');
            assert(cursor.pos > 5);
        });
    });

    context('closing tag', () => {
        it('emits tag', () => {
            const cursor = new Cursor('This </a> that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '</a>');
            assert(cursor.pos > 5);
        });
    });

    context('closing tag with extra whitespace', () => {
        it('emits tag', () => {
            const cursor = new Cursor('This </a   > that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '</a   >');
            assert(cursor.pos > 5);
        });
    });

    context('self-closing tag, no attributes', () => {
        it('emits tag', () => {
            const cursor = new Cursor('This <input /> that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '<input />');
            assert(cursor.pos > 5);
        });
    });

    context('self-closing tag, with attributes', () => {
        it('emits tag', () => {
            const cursor = new Cursor('This <input value="hi"/> that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '<input value="hi"/>');
            assert(cursor.pos > 5);
        });
    });

    context('invalid tags', () => {
        it('does not emit', () => {
            const cursor = new Cursor('<3> </ a> </a asdfs> </a/>');
            while (cursor.hasCurrent()) {
                const node = rule.parse(cursor.clone());
                assert.equal(node, null);
                cursor.skip();
            }
        });
    });

    context('unclosed tags', () => {
        it('does not emit', () => {
            const cursor = new Cursor('<a lorem ipsum dolor sit amet');
            while (cursor.hasCurrent()) {
                const node = rule.parse(cursor.clone());
                assert.equal(node, null);
                cursor.skip();
            }
        });
    });

});
