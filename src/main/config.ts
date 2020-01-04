export interface CursorConfig {
    inlineControlChars: string;
}

export type RhoConfig = CursorConfig;

export const DEFAULT_CONFIG: RhoConfig = {
    /**
     * Characters used to demarcate plain text from inline semantic constructs.
     */
    inlineControlChars: `\\$<>\`"$%_*![({=`,
};
