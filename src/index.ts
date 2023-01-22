import stylesheet from "../style.css" assert { type: "css" };

export class NumText extends HTMLElement {
  #gutter = document.createElement("ol");
  #editor = document.createElement("textarea");
  #lineCount = 0;

  readonly shadowRoot = this.attachShadow({ mode: "open", delegatesFocus: true });

  constructor() {
    super();

    this.addEventListener("mousedown",event => {
      const [target] = event.composedPath() as Element[];
      if (target === this.#editor) return;

      event.preventDefault();
      this.#editor.focus({ preventScroll: !this.#gutter.contains(target) });
    });

    this.#gutter.part.add("gutter");

    this.#gutter.addEventListener("mousedown",event => {
      const index = [...this.#gutter.children].indexOf(event.target as Element);
      const lineIndex = this.#lineIndices[index];
      this.#editor.setSelectionRange(lineIndex,lineIndex);
      this.blur();
    });

    this.#gutter.addEventListener("dblclick",event => {
      const indices = this.#lineIndices;
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
      this.#refreshGutter();
    });

    this.#editor.addEventListener("scroll",() => {
      this.#refreshScroll();
    },{ passive: true });

    new ResizeObserver(() => {
      this.#gutter.style.height = `${this.#editor.offsetHeight}px`;
    }).observe(this.#editor);

    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(this.#gutter,this.#editor);

    this.#editor.setSelectionRange(0,0);
    this.#refreshGutter();
  }

  #getLineCount() {
    return (this.#editor.value.match(/\n/g) || []).length + 1;
  }

  #getStringIndices(string: string) {
    const matches = [...this.#editor.value.matchAll(new RegExp(string,"g"))];
    const result = matches.map(match => match.index!);
    return result;
  }

  #refreshGutter() {
    const previous = this.#lineCount;
    const next = this.#getLineCount();
    const difference = next - previous;
    if (difference === 0) return;

    if (difference > 0){
      const line = document.createElement("li");
      line.part.add("line-number");

      const lines = Array.from({ length: difference },() => line.cloneNode() as HTMLLIElement);
      this.#gutter.append(...lines);
    } else {
      for (let i = 0; i < Math.abs(difference); i++){
        this.#gutter.lastChild?.remove();
      }
    }

    this.#lineCount = next;
  }

  #refreshScroll() {
    const { offsetHeight, clientHeight, scrollHeight, scrollTop } = this.#editor;

    const scrollBottom = clientHeight + scrollTop;
    const scrollBarHeight = offsetHeight - clientHeight;
    const overScrollY = (scrollTop < 0 || scrollBottom > scrollHeight) ? (scrollTop < 0) ? scrollTop : scrollBottom - scrollHeight : 0;

    if (scrollBarHeight > 0){
      this.#gutter.style.setProperty("--overflow-offset-y",`${scrollBarHeight}px`);
    } else {
      this.#gutter.style.removeProperty("--overflow-offset-y");
    }

    if (overScrollY === 0){
      this.#gutter.style.removeProperty("--overscroll-top");
      this.#gutter.style.removeProperty("--overscroll-bottom");
    } else if (overScrollY < 0){
      this.#gutter.style.setProperty("--overscroll-top",`${Math.abs(overScrollY)}px`);
    } else {
      this.#gutter.style.setProperty("--overscroll-bottom",`${overScrollY}px`);
    }

    if (this.#gutter.scrollTop !== scrollTop){
      this.#gutter.scrollTop = scrollTop;
    }
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

  get #lineIndices() {
    const indices = this.#getStringIndices("\n");
    for (const index in indices){
      indices[index]++;
    }
    indices.unshift(0);
    return indices;
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

  get value() {
    return this.#editor.value;
  }
}

window.customElements.define("num-text",NumText);

declare global {
  interface HTMLElementTagNameMap {
    "num-text": NumText;
  }
}

export default NumText;