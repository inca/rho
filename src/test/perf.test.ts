import path from 'path';
import fs from 'fs';
import { RhoProcessor } from '../main';
import marked from 'marked';

const processor = new RhoProcessor();

describe.only('Performance', () => {
    let source: string;

    beforeEach(() => {
        const file = path.join(process.cwd(), 'src/test/perf/blob.txt');
        source = fs.readFileSync(file, 'utf-8');
    });

    it('compiles 100 large files with Rho', () => {
        for (let i = 0; i < 100; i++) {
            processor.process(source);
        }
    });

    it('compiles 100 large files with marked', () => {
        for (let i = 0; i < 100; i++) {
            marked(source);
        }
    });
});
