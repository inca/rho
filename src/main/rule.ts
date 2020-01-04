import { Cursor } from './cursor';
import { Node } from './node';
import { RhoConfig } from './config';

/**
 *
 */
export abstract class ParseRule {
    constructor(readonly config: RhoConfig) {}
    abstract parseNext(cursor: Cursor): Node | null;
}
