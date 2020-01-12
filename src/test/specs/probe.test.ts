import { RhoProcessor } from '../../main/processor';
import { Region } from '../../main/core';

describe.skip('Probe', () => {

    const processor = new RhoProcessor();
    const parser = processor.getParser('block');

    const text = `
Hello

  - A terse list

  - Some other list item

    - foo
    - bar
    - baz

  - Next item

End of it.
`;

    it('works', () => {
        console.log(parser.parseString(text).render(processor));
    });

});
