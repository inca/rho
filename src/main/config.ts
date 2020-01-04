export interface Config {
    inlineControlChars: string;
}

export const DEFAULT_CONFIG: Config = {
    /**
     * Characters used to demarcate plain text from inline semantic constructs.
     */
    inlineControlChars: `\\$<>\`"$%_*![({=`,
};
