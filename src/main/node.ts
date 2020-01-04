import { StringRegion } from './region';
import { RhoConfig } from './config';

/**
 * Represents an AST node produced by parsing rules.
 */
export abstract class Node {
    constructor(
        readonly region: StringRegion
    ) {}

    // TODO consider changing to Visitor if it's more convenient
    abstract render(config: RhoConfig): string;
}
