export interface RhoOptions {
    externalLinks: boolean;
    lazyImages: boolean;
    leftSingleQuote: string;
    rightSingleQuote: string;
    leftDoubleQuote: string;
    rightDoubleQuote: string;
}

export const RHO_DEFAULT_OPTIONS: RhoOptions = {
    externalLinks: false,
    lazyImages: true,
    leftSingleQuote: '‘',
    rightSingleQuote: '’',
    leftDoubleQuote: '“',
    rightDoubleQuote: '”',
};
