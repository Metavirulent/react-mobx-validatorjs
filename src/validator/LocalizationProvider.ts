/**
 * A LocalizationProvider is an adapter for a certain localization library.
 * Localization is used to localize attribute names.
 */
export interface LocalizationProvider {
    /**
     * Translate the given key using the current language.
     * @param key the key to translate.
     * @return the translated message.
     */
    translate(key: string): string;

    /**
     * Return the current language to use.
     */
    language(): string;
}
