import path from 'path';
import fs from 'fs';
import { RhoProcessor } from '../main';
import { globalStats } from '../main/core/stats';

const processor = new RhoProcessor();

describe.only('Performance', () => {
    let source: string;

    beforeEach(() => {
        const file = path.join(process.cwd(), 'src/test/perf/blob.txt');
        source = fs.readFileSync(file, 'utf-8');
        for (const key of Object.keys(globalStats)) {
            (globalStats as any)[key] = 0;
        }
    });

    it('compiles 100 large files under 5s', () => {
        for (let i = 0; i < 100; i++) {
            processor.process(source);
        }
        console.log(globalStats);
    });

});
