export const DEFAULT_CONTROL_CHARACTERS =
    '\\~`!@#$%^&*()-_+="\'<>{}[]/|'
        .split('')
        .map(_ => _.charCodeAt(0));

export const CHAR_SPACE = 0x20;
export const CHAR_TAB = 0x09;
export const CHAR_LF = 0x0a;
export const CHAR_FF = 0x0c;
export const CHAR_CR = 0x0d;

export const CHAR_EXCLAMATION = 0x21;
export const CHAR_QUOTE_DOUBLE = 0x22;
export const CHAR_HASH = 0x23;
export const CHAR_DOLLAR = 0x24;
export const CHAR_PERCENT = 0x25;
export const CHAR_AMP = 0x26;
export const CHAR_QUOTE_SINGLE = 0x27;
export const CHAR_PAREN_LEFT = 0x28;
export const CHAR_PAREN_RIGHT = 0x29;
export const CHAR_ASTERISK = 0x2a;
export const CHAR_PLUS = 0x2b;
export const CHAR_COMMA = 0x2c;
export const CHAR_MINUS = 0x2d;
export const CHAR_PERIOD = 0x2e;
export const CHAR_SLASH = 0x2f;

export const CHAR_COLON = 0x3a;
export const CHAR_SEMICOLON = 0x3b;
export const CHAR_LT = 0x3c;
export const CHAR_EQUALS = 0x3d;
export const CHAR_GT = 0x3e;
export const CHAR_QUESTION = 0x3f;
export const CHAR_AT = 0x40;

export const CHAR_SQUARE_LEFT = 0x5b;
export const CHAR_BACKSLASH = 0x5c;
export const CHAR_SQUARE_RIGHT = 0x5d;
export const CHAR_CIRCUMFLEX = 0x5e;
export const CHAR_UNDERSCORE = 0x5f;
export const CHAR_BACKTICK = 0x60;

export const CHAR_CURLY_LEFT = 0x7b;
export const CHAR_PIPE = 0x7c;
export const CHAR_CURLY_RIGHT = 0x7d;
export const CHAR_TILDE = 0x7e;

export const RANGE_LATIN_UPPER_START = 0x41;
export const RANGE_LATIN_UPPER_END = 0x5a;
export const RANGE_LATIN_LOWER_START = 0x61;
export const RANGE_LATIN_LOWER_END = 0x7a;
export const RANGE_DIGIT_START = 0x30;
export const RANGE_DIGIT_END = 0x39;
