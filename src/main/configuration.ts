export interface Configuration {
    inlineControlChars: string;
}

export const DEFAULT_CONFIGURATION: Configuration = {
    /**
     * Characters used to demarcate plain text from inline semantic constructs.
     */
    inlineControlChars: `\\$<>\`"$%_*![({=`,
};
