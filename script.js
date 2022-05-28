class NumTextElement extends HTMLElement {
  constructor() {
    super();
    this.defined = false;
  }
  connectedCallback() {
    if (this.defined || !this.isConnected) return;
    this.defined = true;
    this.innerHTML = `<ol></ol><textarea wrap="off" spellcheck="false" autocomplete="off" autocapitalize="none" autocorrect="off"></textarea>`;
    this.addEventListener("mousedown",event => {
      if (event.target === this.editor) return;
      event.preventDefault();
      this.editor.focus({ preventScroll: !this.gutter.contains(event.target) });
    });
    this.gutter.addEventListener("mousedown",event => {
      const index = [...this.gutter.children].indexOf(event.target);
      const lineIndex = this.lineIndices[index];
      this.editor.setSelectionRange(lineIndex,lineIndex);
      this.blur();
    });
    this.gutter.addEventListener("dblclick",event => {
      const indices = this.lineIndices;
      const line = [...this.gutter.children].indexOf(event.target);
      const lineStartIndex = indices[line];
      const lineEndIndex = (line + 1 in indices) ? indices[line + 1] : this.editor.value.length;
      this.editor.setSelectionRange(lineStartIndex,lineEndIndex);
    });
    this.editor.addEventListener("input",() => this.refreshLineNumbers());
    this.editor.addEventListener("scroll",() => this.refreshScrollPosition(),{ passive: true });
    new ResizeObserver(() => {
      this.gutter.style.height = `${this.editor.offsetHeight}px`;
    }).observe(this.editor);
    this.editor.setSelectionRange(0,0);
    this.refreshLineNumbers();
  }
  get editor() {
    return this.querySelector("textarea");
  }
  get gutter() {
    return this.querySelector("ol");
  }
  get lineCount() {
    return (this.editor.value.match(/\n/g) || []).length + 1;
  }
  refreshLineNumbers() {
    const previous = this.getAttribute("line-count") || 0;
    const next = this.lineCount;
    const difference = next - previous;
    if (difference === 0) return;
    if (difference > 0){
      const fragment = new DocumentFragment();
      const line = document.createElement("li");
      for (let i = 0; i < difference; i++) fragment.append(line.cloneNode());
      this.gutter.append(fragment);
    }
    if (difference < 0){
      for (let i = 0; i < Math.abs(difference); i++){
        this.gutter.lastChild.remove();
      }
    }
    this.setAttribute("line-count",next);
  }
  getStringIndices(string) {
    const matches = [...this.editor.value.matchAll(new RegExp(string,"g"))];
    return matches.map(match => match.index);
  }
  get lineIndices() {
    const indices = this.getStringIndices("\n");
    for (const index in indices) indices[index]++;
    indices.unshift(0);
    return indices;
  }
  refreshScrollPosition() {
    const { offsetWidth, offsetHeight, clientWidth, clientHeight, scrollWidth, scrollHeight, scrollLeft, scrollTop } = this.editor;
    const scrollRight = clientWidth + scrollLeft;
    const scrollBottom = clientHeight + scrollTop;
    const scrollbarWidth = offsetWidth - clientWidth;
    const scrollbarHeight = offsetHeight - clientHeight;
    const overscrollX = (scrollLeft < 0 || scrollRight > scrollWidth) ? scrollLeft < 0 ? scrollLeft : scrollRight - scrollWidth : false;
    const overscrollY = (scrollTop < 0 || scrollBottom > scrollHeight) ? scrollTop < 0 ? scrollTop : scrollBottom - scrollHeight : false;

    if (scrollbarWidth > 0){
      this.gutter.style.setProperty("--overflow-offset-x",`${scrollbarWidth}px`);
    } else {
      this.gutter.style.removeProperty("--overflow-offset-x");
    }
    if (scrollbarHeight > 0){
      this.gutter.style.setProperty("--overflow-offset-y",`${scrollbarHeight}px`);
    } else {
      this.gutter.style.removeProperty("--overflow-offset-y");
    }

    if (overscrollX === false){
      this.gutter.style.removeProperty("--overscroll-left");
      this.gutter.style.removeProperty("--overscroll-right");
    } else if (overscrollX < 0){
      this.gutter.style.setProperty("--overscroll-left",`${Math.abs(overscrollX)}px`);
    } else if (overscrollX > 0){
      this.gutter.style.setProperty("--overscroll-right",`${overscrollX}px`);
    }
    if (overscrollY === false){
      this.gutter.style.removeProperty("--overscroll-top");
      this.gutter.style.removeProperty("--overscroll-bottom");
    } else if (overscrollY < 0){
      this.gutter.style.setProperty("--overscroll-top",`${Math.abs(overscrollY)}px`);
    } else if (overscrollY > 0){
      this.gutter.style.setProperty("--overscroll-bottom",`${overscrollY}px`);
    }

    if (this.gutter.scrollTop !== scrollTop) this.gutter.scrollTop = scrollTop;
  }
  replace(regexp,value){
    const result = this.editor.value.replace(regexp,value);
    if (result !== this.editor.value){
      this.value = result;
    }
  }
  focus(options){
    this.editor.focus(options);
  }
  blur(){
    this.editor.blur();
  }
  get value(){
    return this.editor.value;
  }
  set value(value){
    const { activeElement } = document;
    if (activeElement !== this.editor){
      this.focus({ preventScroll: true });
    }
    this.editor.select();
    document.execCommand("insertText",false,value);
    if (activeElement !== this.editor){
      activeElement.focus({ preventScroll: true });
    }
    return value;
  }
  get disabled(){
    return this.editor.disabled;
  }
  set disabled(value){
    (value) ? this.setAttribute("disabled","") : this.removeAttribute("disabled");
    this.editor.disabled = value;
  }
  get readOnly(){
    return this.editor.readOnly;
  }
  set readOnly(value){
    (value) ? this.setAttribute("readonly","") : this.removeAttribute("readonly");
    this.editor.readOnly = value;
  }
}

window.customElements.define("num-text",NumTextElement);