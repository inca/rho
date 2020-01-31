import { ContextWithMedia } from '../context';
import { Node } from '../core';

export interface MediaDef {
    href: string;
    title?: string;
    external?: boolean;
    customRender?: (this: MediaDef, node: Node, ctx: ContextWithMedia) => string;
}
