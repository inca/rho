import { RhoProcessor } from '../main/processor';
import { normalize } from './util';
import fs from 'fs';

const processor = new RhoProcessor();

const str = fs.readFileSync('src/test/cases/block/Nested div block.txt', 'utf-8');

describe.skip('debug', () => {

    it('works', () => {
        const out = processor.toHtml(str);
        // console.log(out);
    });

});
