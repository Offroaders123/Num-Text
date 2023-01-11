type ThemeType = "any" | "syntax-highlight" | "user-agent";
interface Theme {
    type: ThemeType;
    url?: string;
    stylesheet: HTMLStyleElement;
}
interface ThemeEntry extends Theme {
    elements: NumTextElement[];
}
interface ThemeEntries {
    [name: string]: ThemeEntry;
}
interface DefineThemeOptions {
    type?: ThemeType;
    url?: string;
    template?: HTMLTemplateElement;
    content?: string;
}
interface UpdateThemeOptions {
    name: string;
    url?: string;
    content?: string | null;
}
type ColorScheme = "light" | "dark";
interface LocalTheme extends Theme {
    active: boolean;
}
interface LocalThemes {
    [name: string]: LocalTheme;
}
declare var NumText: {
    themes: {
        entries: ThemeEntries;
        define(name: string, { type, url, template, content }?: DefineThemeOptions): void;
        update({ name, url, content }: UpdateThemeOptions): Promise<void>;
        fetch(url: string): Promise<string>;
        _tempBackwardsCompatibility_(content: string): string;
        remove(name: string): void;
        has(name: string): boolean;
    };
};
declare class NumTextElement extends HTMLElement {
    defined: boolean;
    colorScheme: {
        set: (appearance: ColorScheme) => ColorScheme;
        toggle: () => ColorScheme;
        get: () => ColorScheme;
    };
    themes: {
        entries: LocalThemes;
        add: (name: string) => void;
        remove: (name: string) => void;
        has: (name: string) => boolean;
        enable: (name: string) => void;
        disable: (name: string) => void;
        active: (name: string) => boolean | undefined;
        toggle: (name: string) => boolean | void;
        getAll: (type: ThemeType) => string[];
    };
    syntaxHighlight: {
        enable: () => void;
        disable: () => void;
        active: () => boolean;
        toggle: () => void;
    };
    container: HTMLDivElement;
    gutter: HTMLOListElement;
    content: HTMLDivElement;
    syntax: HTMLPreElement;
    editor: HTMLTextAreaElement;
    constructor();
    connectedCallback(): void;
    refreshLineNumbers(): void;
    refreshSyntaxOverlay(): void;
    refreshScrollPosition(): void;
    getCharacterIndexes(character: string): number[];
    getLineIndexes(): number[];
    replace(pattern: string | RegExp, value: string): void;
    focus({ preventScroll }?: {
        preventScroll?: boolean | undefined;
    }): void;
    blur(): void;
    get syntaxLanguage(): string;
    set syntaxLanguage(language: string);
    get value(): string;
    set value(content: string);
    get disabled(): boolean;
    set disabled(state: boolean);
    get readonly(): boolean;
    set readonly(state: boolean);
}
