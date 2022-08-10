declare global {
  interface CSSStyleSheet {
    replace(text: string): Promise<CSSStyleSheet>;
  }
  interface ShadowRoot {
    adoptedStyleSheets: CSSStyleSheet[];
  }
}

const stylesheet = new CSSStyleSheet();
const styles = fetch("../src/style.css");

styles.then(async response => {
  const result = await response.text();
  stylesheet.replace(result);
});

export class NumTextElement extends HTMLElement {
  #defined = false;
  #gutter: HTMLOListElement;
  #textarea: HTMLTextAreaElement;
  #lineCount: number;
  #value = this.textContent;

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
  }
  
  connectedCallback() {
    if (this.#defined || !this.isConnected) return;
    this.#defined = true;

    this.addEventListener("mousedown",event => {
      const [target] = event.composedPath();
      if (target === this.#textarea) return;
      event.preventDefault();
      this.#textarea.focus({ preventScroll: !this.#gutter.contains(target as Node) });
    });

    this.#gutter = Object.assign(document.createElement("ol"),{
      part: "gutter"
    });

    this.#gutter.addEventListener("mousedown",event => {
      const index = [...this.gutter.children].indexOf(event.target as Element);
      const lineIndex = this.lineIndices[index];
      this.#textarea.setSelectionRange(lineIndex,lineIndex);
      this.blur();
    });

    this.#gutter.addEventListener("dblclick",event => {
      const indices = this.lineIndices;
      const line = [...this.#gutter.children].indexOf(event.target as Element);
      const lineStartIndex = indices[line];
      const lineEndIndex = line + 1 in indices ? indices[line + 1] : this.#textarea.value.length;
      this.#textarea.setSelectionRange(lineStartIndex,lineEndIndex);
    });

    this.#textarea = Object.assign(document.createElement("textarea"),{
      part: "textarea",
      wrap: "off",
      spellcheck: false,
      autocomplete: "off",
      autocapitalize: "none",
      value: this.#value
    });
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

  getLineCount() {
    return (this.#textarea.value.match(/\n/g) || []).length + 1;
  }

  getStringIndices(string: string) {
    const matches = [...this.#textarea.value.matchAll(new RegExp(string,"g"))];
    return matches.map(match => match.index);
  }

  refreshGutter() {
    const previous = this.#lineCount || 0;
    const next = this.getLineCount();
    const difference = next - previous;
    if (difference === 0) return;

    if (difference > 0){
      const line = Object.assign(document.createElement("li"),{
        part: "line-number"
      });
      const lines: HTMLLIElement[] = Array(difference).fill(line.cloneNode());
      this.#gutter.append(...lines);
    }

    if (difference < 0){
      // Experimental replaceChildren() implementation
      // const lines = [...this.#gutter.querySelectorAll("li")];
      // console.log(lines.length);
      // const keep = lines.slice(0,lines.length - Math.abs(difference));
      // console.log(keep);
      // this.#gutter.style.background;
      // this.#gutter.replaceChildren(...keep);

      for (let i = 0; i < Math.abs(difference); i++){
        this.#gutter.lastChild.remove();
      }
    }

    this.#lineCount = next;
  }

  refreshScroll() {
    const { offsetWidth, offsetHeight, clientWidth, clientHeight, scrollWidth, scrollHeight, scrollLeft, scrollTop } = this.#textarea;

    const scrollRight = clientWidth + scrollLeft;
    const scrollBottom = clientHeight + scrollTop;
    const scrollBarWidth = offsetWidth - clientWidth;
    const scrollBarHeight = offsetHeight - clientHeight;
    const overScrollX = (scrollLeft < 0 || scrollRight > scrollWidth) ? scrollLeft < 0 ? scrollLeft : scrollRight - scrollWidth : 0;
    const overScrollY = (scrollTop < 0 || scrollBottom > scrollHeight) ? scrollTop < 0 ? scrollTop : scrollBottom - scrollHeight : 0;

    if (scrollBarWidth > 0){
      this.#gutter.style.setProperty("--overflow-offset-x",`${scrollBarWidth}px`);
    } else {
      this.#gutter.style.removeProperty("--overflow-offset-x");
    }

    if (scrollBarHeight > 0){
      this.#gutter.style.setProperty("--overflow-offset-y",`${scrollBarHeight}px`);
    } else {
      this.#gutter.style.removeProperty("--overflow-offset-y");
    }

    if (overScrollX === 0){
      this.#gutter.style.removeProperty("--overscroll-left");
      this.#gutter.style.removeProperty("--overscroll-right");
    }
    
    if (overScrollX < 0){
      this.#gutter.style.setProperty("--overscroll-left",`${Math.abs(overScrollX)}px`);
    }
    
    if (overScrollX > 0){
      this.#gutter.style.setProperty("--overscroll-right",`${overScrollX}px`);
    }

    if (overScrollY === 0){
      this.#gutter.style.removeProperty("--overscroll-top");
      this.#gutter.style.removeProperty("--overscroll-bottom");
    }

    if (overScrollY < 0){
      this.#gutter.style.setProperty("--overscroll-top",`${Math.abs(overScrollY)}px`);
    }

    if (overScrollY > 0){
      this.#gutter.style.setProperty("--overscroll-bottom",`${overScrollY}px`);
    }

    if (this.#gutter.scrollTop !== scrollTop){
      this.#gutter.scrollTop = scrollTop;
    }
  }

  replace(searchValue: string | RegExp,replaceValue: string) {
    const result = this.#textarea.value.replace(searchValue,replaceValue);
    if (result !== this.#textarea.value){
      this.value = result;
    }
  }

  focus(options?: FocusOptions) {
    this.#textarea.focus(options);
  }

  blur() {
    this.#textarea.blur();
  }

  get gutter() {
    return this.#gutter;
  }

  get textarea() {
    return this.#textarea;
  }

  get lineCount() {
    return this.#lineCount;
  }

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
    if (activeElement !== this){
      (activeElement as HTMLElement).focus({ preventScroll: true });
    }
  }

  get value() {
    return this.#value;
  }
}

window.customElements.define("num-text",NumTextElement);