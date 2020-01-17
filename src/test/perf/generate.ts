import path from 'path';
import { generateTextFile } from './gen-utils';

const file = path.join(process.cwd(), 'src/test/perf/blob.txt');
generateTextFile(file);
