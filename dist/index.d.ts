declare global {
    interface CSSStyleSheet {
        replace(text: string): Promise<CSSStyleSheet>;
    }
    interface ShadowRoot {
        adoptedStyleSheets: CSSStyleSheet[];
    }
}
export declare class NumTextElement extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    getLineCount(): number;
    getStringIndices(string: string): number[];
    refreshGutter(): void;
    refreshScroll(): void;
    replace(searchValue: string | RegExp, replaceValue: string): void;
    focus(options?: FocusOptions): void;
    blur(): void;
    get gutter(): HTMLOListElement;
    get textarea(): HTMLTextAreaElement;
    get lineCount(): number;
    get lineIndices(): number[];
    set value(value: string);
    get value(): string;
}
