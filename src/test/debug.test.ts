import { RhoProcessor } from '../main/processor';
import fs from 'fs';

const processor = new RhoProcessor();

const str = fs.readFileSync('src/test/cases/block/Nested div block.txt', 'utf-8');

describe.skip('debug', () => {

    it('works', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const out = processor.toHtml(str);
        // console.log(out);
    });

});
