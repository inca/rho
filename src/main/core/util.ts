export const DEFAULT_CONTROL_CHARACTERS =
    '\\~`!@#$%^&*()-_+="<>{}[]/|'
    .split('')
    .map(_ => _.charCodeAt(0));

/**
 * Utility function to convert custom-specified list of character codes.
 */
export function convertCharCodes(chars?: string | number[]): number[] {
    if (chars == null) {
        return DEFAULT_CONTROL_CHARACTERS;
    }
    if (typeof chars === 'string') {
        return chars.split('').map(_ => _.charCodeAt(0));
    }
    return chars;
}
