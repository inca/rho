export interface RhoOptions {
    externalLinks: boolean;
    leftSingleQuote: string;
    rightSingleQuote: string;
    leftDoubleQuote: string;
    rightDoubleQuote: string;
}

export const RHO_DEFAULT_OPTIONS: RhoOptions = {
    externalLinks: false,
    leftSingleQuote: '‘',
    rightSingleQuote: '’',
    leftDoubleQuote: '“',
    rightDoubleQuote: '”',
};
