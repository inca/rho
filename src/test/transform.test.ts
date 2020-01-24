import assert from 'assert';
import { RhoProcessor, HtmlElementNode, LiteralNode, Node } from '../main';

describe('Transforms', () => {

    it('allows removing unwanted nodes', () => {
        const rho = new RhoProcessor();
        rho.transform(node => {
            if (node instanceof HtmlElementNode && node.tagName === 'em') {
                return [];
            }
            return [node];
        });
        const t = rho.toHtml('This _and_ that').trim();
        assert.equal(t, '<p>This  that</p>');
    });

    it('allows modifying nodes', () => {
        const rho = new RhoProcessor();
        rho.transform(node => {
            if (node instanceof HtmlElementNode && node.tagName === 'strong') {
                node.tagName = 'em';
            }
            return [node];
        });
        const t = rho.toHtml('This *and* that').trim();
        assert.equal(t, '<p>This <em>and</em> that</p>');
    });

    it('allows replacing node with single node', () => {
        const rho = new RhoProcessor();
        rho.transform(node => {
            if (node instanceof HtmlElementNode && node.tagName === 'strong') {
                return [
                    new LiteralNode(node.region, 'XXX')
                ];
            }
            return [node];
        });
        const t = rho.toHtml('This *and* that').trim();
        assert.equal(t, '<p>This XXX that</p>');
    });

    it('allows replacing nodes with more nodes', () => {
        const rho = new RhoProcessor();
        rho.transform(node => {
            if (node instanceof HtmlElementNode && node.tagName === 'strong') {
                return [
                    new LiteralNode(node.region, 'X'),
                    new LiteralNode(node.region, 'Y'),
                    new LiteralNode(node.region, 'Z'),
                ];
            }
            return [node];
        });
        const t = rho.toHtml('This *and* that').trim();
        assert.equal(t, '<p>This XYZ that</p>');
    });

    it('allows stacking transforms', () => {
        const rho = new RhoProcessor();
        rho.transform(node => {
            if (node instanceof HtmlElementNode && node.tagName === 'strong') {
                return [
                    new LiteralNode(node.region, 'X'),
                    new LiteralNode(node.region, 'Y'),
                    new LiteralNode(node.region, 'Z'),
                ];
            }
            return [node];
        });
        rho.transform(node => {
            if (node instanceof LiteralNode) {
                node.text = node.text.toLowerCase();
            }
            return [node];
        });
        const t = rho.toHtml('This *and* that').trim();
        assert.equal(t, '<p>This xyz that</p>');
    });

});
