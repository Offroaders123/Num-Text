declare global {
  interface Window {
    Prism: typeof import("prismjs");
  }
}

export {};