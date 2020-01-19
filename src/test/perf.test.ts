import path from 'path';
import fs from 'fs';
import { RhoProcessor } from '../main';
import { globalStats } from '../main/core/stats';

const processor = new RhoProcessor();

describe.skip('Performance', () => {
    let source: string;

    beforeEach(() => {
        const file = path.join(process.cwd(), 'src/test/perf/blob.txt');
        source = fs.readFileSync(file, 'utf-8');
        for (const key of Object.keys(globalStats)) {
            (globalStats as any)[key] = 0;
        }
    });

    it('compiles 50 large files under 5s', () => {
        for (let i = 0; i < 50; i++) {
            processor.process(source);
        }
        console.log(globalStats);
    });

    it.skip('writes to file', () => {
        const out = processor.process(source);
        const file = path.join(process.cwd(), 'src/test/perf/blob.html');
        fs.writeFileSync(file, out, 'utf-8');
    });

});
