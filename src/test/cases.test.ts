import glob from 'glob';
import path from 'path';
import assert from 'assert';
import { promises as fs } from 'fs';
import { RhoProcessor } from '../main/processor';
import pretty from 'pretty';
import { normalize } from './util';

const baseDir = path.resolve(process.cwd(), 'src/test/cases');
const sourceFiles = glob.sync('**/*.txt', {
    cwd: baseDir
});

describe('cases', () => {

    const processor = new RhoProcessor();

    for (const file of sourceFiles) {
        const baseName = file.replace(/\.txt$/, '');

        it(baseName, async () => {
            const srcFile = path.resolve(baseDir, baseName + '.txt');
            const dstFile = path.resolve(baseDir, baseName + '.html');
            const text = await fs.readFile(srcFile, 'utf-8');
            const expected = await fs.readFile(dstFile, 'utf-8');
            const actual = processor.toHtml(text);
            assert.equal(normalize(actual), normalize(expected));
        });
    }

});
