export interface RhoConfig {
    inlineControlChars: string;
}

export const DEFAULT_CONFIG: RhoConfig = {
    /**
     * Characters used to demarcate plain text from inline semantic constructs.
     */
    inlineControlChars: `\\$<>\`"$%_*![({=`,
};
