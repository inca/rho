import path from 'path';
import fs from 'fs';
import { RhoProcessor } from '../main';

const processor = new RhoProcessor();

describe.skip('Performance', () => {
    let source: string;

    beforeEach(() => {
        const file = path.join(process.cwd(), 'src/test/benchmark/blob.txt');
        source = fs.readFileSync(file, 'utf-8');
    });

    it('compiles 50 large files under 5s', () => {
        for (let i = 0; i < 50; i++) {
            processor.process(source);
        }
    });

});
