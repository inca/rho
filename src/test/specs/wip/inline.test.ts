import { DefaultProcessor } from '../../../main/default';

describe('Inline parser', () => {

    const processor = new DefaultProcessor();
    const parser = processor.getParser('inline');

    it('parses em', () => {
        const str = 'This _and_ that; this *&* that.';
        const node = parser.parseString(str);
        console.log(node.debug());
        console.log(node.render(processor));
    });

});
