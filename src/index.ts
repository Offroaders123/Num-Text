import stylesheet from "../style.css" assert { type: "css" };

/**
 * A simple Web Component that adds line numbers to native textarea elements.
 * It extends the base HTMLElement class.
*/
export class NumText extends HTMLElement {
  #isDefined = false;
  #gutter = document.createElement("ol");
  #textarea = document.createElement("textarea");
  #lineCount = 0;
  #value = this.textContent ?? "";

  declare readonly shadowRoot: ShadowRoot;

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
  }

  connectedCallback() {
    if (this.#isDefined || !this.isConnected) return;
    this.#isDefined = true;

    this.addEventListener("mousedown",event => {
      const [target] = event.composedPath() as Element[];
      if (target === this.#textarea) return;

      event.preventDefault();
      this.#textarea.focus({ preventScroll: !this.#gutter.contains(target) });
    });

    this.#gutter.part.add("gutter");

    this.#gutter.addEventListener("mousedown",event => {
      const index = [...this.#gutter.children].indexOf(event.target as Element);
      const lineIndex = this.lineIndices[index];
      this.#textarea.setSelectionRange(lineIndex,lineIndex);
      this.blur();
    });

    this.#gutter.addEventListener("dblclick",event => {
      const indices = this.lineIndices;
      const line = [...this.#gutter.children].indexOf(event.target as Element);
      const lineStartIndex = indices[line];
      const lineEndIndex = (line + 1 in indices) ? indices[line + 1] : this.#textarea.value.length;
      this.#textarea.setSelectionRange(lineStartIndex,lineEndIndex);
    });

    this.#textarea.part.add("textarea");
    this.#textarea.wrap = "off";
    this.#textarea.spellcheck = false;
    this.#textarea.autocomplete = "off";
    this.#textarea.autocapitalize = "none";
    this.#textarea.value = this.#value;
    this.#textarea.setAttribute("autocorrect","off");

    this.#textarea.addEventListener("input",() => {
      this.refreshGutter();
    });

    this.#textarea.addEventListener("scroll",() => {
      this.refreshScroll();
    },{ passive: true });

    new ResizeObserver(() => {
      this.#gutter.style.height = `${this.#textarea.offsetHeight}px`;
    }).observe(this.#textarea);

    this.shadowRoot.append(this.#gutter,this.#textarea);
    this.#textarea.setSelectionRange(0,0);
    this.refreshGutter();
  }

  /**
   * Returns the runtime-exact line count for the textarea's value.
   * 
   * The similar, yet different `NumText.prototype.lineCount`
   * getter method instead returns what the stored line count was in relation
   * to the most recent textarea value change. For performance in mind, the
   * getter is a better option.
  */
  getLineCount() {
    return (this.#textarea.value.match(/\n/g) || []).length + 1;
  }

  /**
   * Returns an array that lists the character indices for all
   * instances of the supplied string within the textarea's value.
  */
  getStringIndices(string: string) {
    const matches = [...this.#textarea.value.matchAll(new RegExp(string,"g"))];
    const result = matches.map(match => match.index!);
    return result;
  }

  /**
   * Updates the visible line count within the gutter.
   * This is called automatically for every textarea value change.
  */
  refreshGutter() {
    const previous = this.#lineCount;
    const next = this.getLineCount();
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

  /**
   * Updates the gutter's vertical scroll position to match
   * that of the textarea's. This is automatically called
   * for every textarea scroll position change.
  */
  refreshScroll() {
    const { offsetHeight, clientHeight, scrollHeight, scrollTop } = this.#textarea;

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

  /**
   * Focuses the component's internal textarea element.
  */
  focus(options?: FocusOptions) {
    this.#textarea.focus(options);
  }

  /**
   * Blurs the component's internal textarea element.
  */
  blur() {
    this.#textarea.blur();
  }

  /**
   * References the component's internal gutter element.
  */
  get gutter() {
    return this.#gutter;
  }

  /**
   * References the component's internal textarea element
  */
  get textarea() {
    return this.#textarea;
  }

  /**
   * Returns the line count for the component's value.
  */
  get lineCount() {
    return this.#lineCount;
  }

  /**
   * Returns an array that lists the character indices for all
   * line breaks within the component's value.
  */
  get lineIndices() {
    const indices = this.getStringIndices("\n");
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
    this.#textarea.select();
    document.execCommand("insertText",false,value);
    if (activeElement !== this && activeElement instanceof HTMLElement){
      activeElement.focus({ preventScroll: true });
    }
  }

  get value() {
    return this.#textarea.value;
  }
}

window.customElements.define("num-text",NumText);

declare global {
  interface HTMLElementTagNameMap {
    "num-text": NumText;
  }
}

export default NumText;