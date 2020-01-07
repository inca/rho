import { RhoProcessor } from '../../../main/processor';

describe('Inline parser', () => {

    const processor = new RhoProcessor();
    const parser = processor.getParser('inline');

    it('works', () => {
        const str = 'This _and_ that; this *&* that.';
        const node = parser.parseString(str);
        console.log(node.debug());
        console.log(node.render(processor));
    });

});
