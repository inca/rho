import path from 'path';
import fs from 'fs';
import glob from 'glob';
import { RhoProcessor } from '../main';
import marked from 'marked';

const processor = new RhoProcessor();

const baseDir = path.resolve(process.cwd(), 'src/test/cases');
const sourceFiles = glob.sync('**/*.txt', {
    cwd: baseDir
});
const cases = sourceFiles.map(f => fs.readFileSync(path.resolve(baseDir, f), 'utf-8'))

describe.skip('Performance', () => {
    let source: string;

    beforeEach(() => {
        const file = path.join(process.cwd(), 'src/test/perf/blob.txt');
        source = fs.readFileSync(file, 'utf-8');
    });

    it('compiles 100 large files with Rho', () => {
        for (let i = 0; i < 100; i++) {
            processor.toHtml(source);
        }
    });

    it('compiles 100 large files with marked', () => {
        for (let i = 0; i < 100; i++) {
            marked(source);
        }
    });

    it('compiles 1000 assorted files with Rho', () => {
        for (let i = 0; i < 1000; i++) {
            for (const c of cases) {
                processor.toHtml(c);
            }
        }
    });

});
