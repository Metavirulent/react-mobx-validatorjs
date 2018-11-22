import {LocalizationProvider} from './LocalizationProvider';

export class NoopLocalizationProvider implements LocalizationProvider {
    public translate(key: string): string {
        return key;
    }

    public language(): string {
        return navigator.language || (navigator as any).userLanguage;
    }
}
