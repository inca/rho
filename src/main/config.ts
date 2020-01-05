export interface Config {
    controlCharacters: string;
}

export const DEFAULT_CONFIG: Config = {
    /**
     * Characters used to demarcate plain text from inline semantic constructs.
     */
    controlCharacters: '\\`~!@#$%^&*()-_+="<>{}[]',
};
