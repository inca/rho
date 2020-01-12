import { RhoProcessor } from '../main/processor';
import { prettyPrint } from 'html';

const processor = new RhoProcessor();

const str = `
Paragraph.

- List item 1   {.list} {.item1}
- List item 2   {.item2}
- List item 3   {.item3}

End.
`;

describe.skip('probe', () => {

    it('works', () => {
        const out = prettyPrint(processor.process(str));
        console.log(out);
    });

});
