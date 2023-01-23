import stylesheet from "../style.css" assert { type: "css" };

export class NumText extends HTMLElement {
  #gutter = document.createElement("ol");
  #editor = document.createElement("textarea");
  #lineCount = 0;

  readonly shadowRoot = this.attachShadow({ mode: "open", delegatesFocus: true });

  constructor() {
    super();

    // this.addEventListener("mousedown",event => {
    //   const [target] = event.composedPath() as Element[];
    //   if (target === this.#editor) return;

    //   event.preventDefault();
    //   this.#editor.focus({ preventScroll: !this.#gutter.contains(target) });
    // });

    this.#gutter.part.add("gutter");

    this.#gutter.addEventListener("mousedown",event => {
      const index = [...this.#gutter.children].indexOf(event.target as Element);
      const lineIndex = this.#getLineIndices()[index];
      this.#editor.setSelectionRange(lineIndex,lineIndex);
      this.blur();
    });

    this.#gutter.addEventListener("dblclick",event => {
      const indices = this.#getLineIndices();
      const line = [...this.#gutter.children].indexOf(event.target as Element);
      const lineStartIndex = indices[line];
      const lineEndIndex = (line + 1 in indices) ? indices[line + 1] : this.#editor.value.length;
      this.#editor.setSelectionRange(lineStartIndex,lineEndIndex);
    });

    this.#editor.part.add("editor");
    this.#editor.wrap = "off";
    this.#editor.spellcheck = false;
    this.#editor.autocomplete = "off";
    this.#editor.autocapitalize = "none";
    this.#editor.value = this.textContent ?? "";
    this.#editor.setAttribute("autocorrect","off");

    this.#editor.addEventListener("input",() => {
      this.#renderGutter();
      this.#renderOverflow();
    });

    // this.#editor.addEventListener("scroll",() => {
    //   this.#renderOverflow();
    // },{ passive: true });

    // new ResizeObserver(() => {
    //   this.#gutter.style.height = `${this.#editor.offsetHeight}px`;
    // }).observe(this.#editor);

    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(this.#gutter,this.#editor);

    this.#editor.setSelectionRange(0,0);
    this.#renderGutter();
    this.#renderOverflow();
  }

  #renderGutter() {
    const previous = this.#lineCount;
    const next = this.#getLineCount();
    const difference = next - previous;
    if (difference === 0) return;

    if (difference > 0){
      this.#addLineNumbers(difference);
    } else {
      this.#removeLineNumbers(Math.abs(difference));
    }

    this.#lineCount = next;
  }

  #addLineNumbers(length: number) {
    const template = document.createElement("li");
    template.part.add("line-number");

    const lineNumbers = Array.from({ length },() => template.cloneNode() as HTMLLIElement);
    this.#gutter.append(...lineNumbers);
  }

  #removeLineNumbers(length: number) {
    for (let i = 0; i < length; i++){
      this.#gutter.lastChild?.remove();
    }
  }

  #renderOverflow() {
    this.#editor.style.width = "0";
    this.#editor.style.minWidth = "0";
    this.#editor.style.height = "0";

    const { scrollWidth: editorWidth, scrollHeight: editorHeight } = this.#editor;

    // console.log(scrollWidth,scrollHeight);

    this.#gutter.style.height = `${editorHeight}px`;

    this.#editor.style.minWidth = `${editorWidth}px`;
    this.#editor.style.height = `${editorHeight}px`;
  }

  #getLineCount() {
    const { length } = this.#editor.value.match(/\n/g) ?? [];
    return length + 1;
  }

  #getLineIndices() {
    const matches = [...this.#editor.value.matchAll(/\n/g)];
    const indices = [0];

    for (const { index } of matches){
      indices.push(index! + 1);
    }

    return indices;
  }

  focus(options?: FocusOptions) {
    this.#editor.focus(options);
  }

  blur() {
    this.#editor.blur();
  }

  get gutter() {
    return this.#gutter;
  }

  get editor() {
    return this.#editor;
  }

  get lineCount() {
    return this.#lineCount;
  }

  get value() {
    return this.#editor.value;
  }

  set value(value: string) {
    const { activeElement } = document;
    if (activeElement !== this){
      this.focus({ preventScroll: true });
    }
    this.#editor.select();
    document.execCommand("insertText",false,value);
    if (activeElement !== this && activeElement instanceof HTMLElement){
      activeElement.focus({ preventScroll: true });
    }
  }
}

window.customElements.define("num-text",NumText);

declare global {
  interface HTMLElementTagNameMap {
    "num-text": NumText;
  }
}

export default NumText;