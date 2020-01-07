import { RhoProcessor } from '../../main/processor';

describe('Inline parser', () => {

    const processor = new RhoProcessor();
    const parser = processor.getParser('inline');

    it('works', () => {
        const str = 'hello_world_and_stuff';
        const node = parser.parseString(str);
        console.log(node.debug());
        console.log(node.render(processor));
    });

});
