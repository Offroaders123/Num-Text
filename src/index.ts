import styles from "../styles/style.css?inline";

const stylesheet = new CSSStyleSheet();
stylesheet.replace(styles);

export class NumText extends HTMLElement {
  readonly #gutter: HTMLOListElement = document.createElement("ol");
  readonly #editor: HTMLTextAreaElement = document.createElement("textarea");
  #lineCount: number = 0;

  override readonly shadowRoot: ShadowRoot = this.attachShadow({ mode: "open", delegatesFocus: true });

  constructor() {
    super();

    this.addEventListener("mousedown", event => {
      const [target] = event.composedPath() as Element[];
      if (target === this.#editor) return;

      event.preventDefault();
      this.#editor.focus({ preventScroll: !this.#gutter.contains(target!) });
    });

    this.#gutter.part.add("gutter");

    this.#gutter.addEventListener("mousedown", event => {
      const index: number = [...this.#gutter.children].indexOf(event.target as Element);
      const lineIndex: number | null = this.#getLineIndices()[index] ?? null;
      this.#editor.setSelectionRange(lineIndex, lineIndex);
      this.blur();
    });

    this.#gutter.addEventListener("dblclick", event => {
      const indices: number[] = this.#getLineIndices();
      const line: number = [...this.#gutter.children].indexOf(event.target as Element);
      const lineStartIndex: number | null = indices[line] ?? null;
      const lineEndIndex: number | null = (line + 1 in indices) ? indices[line + 1] ?? null : this.#editor.value.length;
      this.#editor.setSelectionRange(lineStartIndex, lineEndIndex);
    });

    this.#editor.part.add("editor");
    this.#editor.wrap = "off";
    this.#editor.spellcheck = false;
    this.#editor.autocomplete = "off";
    this.#editor.autocapitalize = "none";
    this.#editor.value = this.textContent ?? "";
    this.#editor.setAttribute("autocorrect", "off");

    this.#editor.addEventListener("input", () => {
      this.#renderGutter();
    });

    this.#editor.addEventListener("scroll", () => {
      this.#refreshScroll();
    }, { passive: true });

    new ResizeObserver(() => {
      this.#gutter.style.height = `${this.#editor.offsetHeight}px`;
    }).observe(this.#editor);

    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(this.#gutter, this.#editor);

    this.#editor.setSelectionRange(0, 0);
    this.#renderGutter();
  }

  #renderGutter(): void {
    const previous: number = this.#lineCount;
    const next: number = this.#getLineCount();
    const difference: number = next - previous;
    if (difference === 0) return;

    if (difference > 0) {
      this.#addLineNumbers(difference);
    } else {
      this.#removeLineNumbers(Math.abs(difference));
    }

    this.#lineCount = next;
  }

  #addLineNumbers(length: number): void {
    const template: HTMLLIElement = document.createElement("li");
    template.part.add("line-number");

    const lineNumbers: HTMLLIElement[] = Array.from({ length }, () => template.cloneNode() as HTMLLIElement);
    this.#gutter.append(...lineNumbers);
  }

  #removeLineNumbers(length: number): void {
    for (let i: number = 0; i < length; i++) {
      this.#gutter.lastChild?.remove();
    }
  }

  #refreshScroll(): void {
    const { offsetHeight, clientHeight, scrollHeight, scrollTop } = this.#editor;

    const scrollBottom: number = clientHeight + scrollTop;
    const scrollBarHeight: number = offsetHeight - clientHeight;
    const overScrollY: number = (scrollTop < 0 || scrollBottom > scrollHeight) ? (scrollTop < 0) ? scrollTop : scrollBottom - scrollHeight : 0;

    if (scrollBarHeight > 0) {
      this.#gutter.style.setProperty("--overflow-offset-y", `${scrollBarHeight}px`);
    } else {
      this.#gutter.style.removeProperty("--overflow-offset-y");
    }

    if (overScrollY === 0) {
      this.#gutter.style.removeProperty("--overscroll-top");
      this.#gutter.style.removeProperty("--overscroll-bottom");
    } else if (overScrollY < 0) {
      this.#gutter.style.setProperty("--overscroll-top", `${Math.abs(overScrollY)}px`);
    } else {
      this.#gutter.style.setProperty("--overscroll-bottom", `${overScrollY}px`);
    }

    if (this.#gutter.scrollTop !== scrollTop) {
      this.#gutter.scrollTop = scrollTop;
    }
  }

  #getLineCount(): number {
    const { length } = this.#editor.value.match(/\n/g) ?? [];
    return length + 1;
  }

  #getLineIndices(): number[] {
    const matches: RegExpExecArray[] = [...this.#editor.value.matchAll(/\n/g)];
    const indices: number[] = [0];

    for (const { index } of matches) {
      indices.push(index! + 1);
    }

    return indices;
  }

  override focus(options?: FocusOptions): void {
    this.#editor.focus(options);
  }

  override blur(): void {
    this.#editor.blur();
  }

  get gutter(): HTMLOListElement {
    return this.#gutter;
  }

  get editor(): HTMLTextAreaElement {
    return this.#editor;
  }

  get lineCount(): number {
    return this.#lineCount;
  }

  get value(): string {
    return this.#editor.value;
  }

  set value(value: string) {
    const { activeElement } = document;
    if (activeElement !== this) {
      this.focus({ preventScroll: true });
    }
    this.#editor.select();
    document.execCommand("insertText", false, value);
    if (activeElement !== this && activeElement instanceof HTMLElement) {
      activeElement.focus({ preventScroll: true });
    }
  }
}

window.customElements.define("num-text", NumText);

declare global {
  interface HTMLElementTagNameMap {
    "num-text": NumText;
  }
}

export default NumText;