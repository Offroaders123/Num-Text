declare global {
  interface CSSStyleSheet {
    replace(text: string): Promise<CSSStyleSheet>;
  }
  interface ShadowRoot {
    adoptedStyleSheets: CSSStyleSheet[];
  }
}

export {};