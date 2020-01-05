import { DefaultProcessor } from '../../../main/default';

describe('Inline parser', () => {

    const processor = new DefaultProcessor();
    const parser = processor.getParser('inline');

    it('parses inline string', () => {
        const str = 'This & that';
        console.log(parser.parseString(str).debug());
    });

    it('parses em', () => {
        const str = 'This _and_ that';
        console.log(parser.parseString(str).debug());
    });

});
