import { Cursor } from './cursor';
import { Node } from './node';
import { RhoConfig } from './config';

/**
 * Rho has modular parsing system.
 *
 * Each parser (i.e. block, inline, code, etc) is configured
 * using a sequence of parsing rules. During parsing a cursor
 * over the region is created and rule is sequentially called
 * on it, until one of the rules emits the AST Node — or until
 * the cursor finishes traversing the region.
 */
export abstract class ParseRule {
    constructor(readonly config: RhoConfig) {}
    abstract parse(cursor: Cursor): Node | null;
}
