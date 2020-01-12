import { RhoProcessor } from '../main/processor';
import { normalize } from './util';

const processor = new RhoProcessor();

const str = `
Paragraph.

- List item 1   {.list} {.item1}
- List item 2   {.item2}
- List item 3   {.item3}

End.
`;

describe.skip('debug', () => {

    it('works', () => {
        const out = normalize(processor.process(str));
        console.log(out);
    });

});
