import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    HtmlCommentRule,
    TextNode,
} from '../../../../main';

describe('HtmlCommentRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new HtmlCommentRule(ctx);

    context('<!--', () => {

        it('emits till -->', () => {
            const cursor = new Cursor('This <!-- blah --> that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '<!-- blah -->');
            assert(cursor.at(' that'));
        });

        it('does not emit if unclosed', () => {
            const cursor = new Cursor('This <!-- blah', 5);
            const node = rule.parse(cursor);
            assert.equal(node, null);
        });

    });

});
