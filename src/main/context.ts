import { Context } from './core';
import { MediaDef } from './util/media';
import { RhoProcessor } from './processor';

// Some rules occasionally use additional features of Context and/or Processor
// (e.g. read specific options).
// Each such feature is encapsulated in a separate interface which extends
// Context and expose additional features.

export interface ContextWithMedia extends Context {
    mediaIds: Set<string>;
    resolvedMedia: Map<string, MediaDef>;
    isExternalLink(media: MediaDef): boolean;
    getNextInlineId(): string;
}

export class RhoContext extends Context
    implements ContextWithMedia {

    constructor(
        // Allows rules to reach processor.options
        readonly processor: RhoProcessor,
    ) {
        super(processor);
    }

    linkCounter: number = 0;
    mediaIds: Set<string> = new Set();
    resolvedMedia: Map<string, MediaDef> = new Map();

    isExternalLink(media: MediaDef): boolean {
        return media.external ?? this.processor.options.externalLinks;
    }

    getNextInlineId() {
        this.linkCounter += 1;
        return '__' + this.linkCounter;
    }
}
