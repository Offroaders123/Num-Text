class NumTextElement extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({ mode: "open" });
    this.defined = false;
  }
  connectedCallback(){
    if (this.defined || !this.isConnected) return;
    this.defined = true;
    this.addEventListener("mousedown",event => {
      var target = event.composedPath()[0];
      if (target == this.editor) return;
      event.preventDefault();
      this.focus({ preventScroll: (!this.gutter.contains(target)) });
    });
    this.container = document.createElement("div");
    this.container.part = "container";
    this.gutter = document.createElement("ol");
    this.gutter.part = "gutter";
    this.gutter.addEventListener("mousedown",event => {
      var index = this.getLineIndexes()[Array.from(this.gutter.children).indexOf(event.target)];
      this.editor.setSelectionRange(index,index);
      this.blur();
    });
    this.gutter.addEventListener("dblclick",event => {
      var indexes = this.getLineIndexes(), line = Array.from(this.gutter.children).indexOf(event.target);
      this.editor.setSelectionRange(indexes[line],(line + 1 in indexes) ? indexes[line + 1] : this.editor.value.length);
    });
    this.gutter.addEventListener("scroll",() => this.refreshScrollPosition(),{ passive: true });
    this.content = document.createElement("div");
    this.content.part = "content";
    this.editor = document.createElement("textarea");
    this.editor.part = "editor";
    this.editor.placeholder = this.getAttribute("placeholder") || "";
    this.editor.wrap = "off";
    this.editor.spellcheck = false;
    this.editor.autocomplete = "off";
    this.editor.autocapitalize = "none";
    this.editor.setAttribute("autocorrect","off");
    this.editor.addEventListener("input",() => this.refreshLineNumbers());
    this.editor.addEventListener("scroll",() => this.refreshScrollPosition(),{ passive: true });
    new ResizeObserver(() => {
      this.style.removeProperty("width");
      this.style.height = `${this.offsetHeight - this.clientHeight + parseInt(this.editor.style.height,10)}px`;
      this.editor.style.removeProperty("height");
      this.refreshScrollPosition();
    }).observe(this.editor);
    this.shadowRoot.appendChild(this.container);
    this.container.appendChild(this.gutter);
    this.container.appendChild(this.content);
    this.content.appendChild(this.editor);
    this.disabled = this.matches("[disabled]");
    this.readonly = this.matches("[readonly]");
    this.editor.value = this.getAttribute("value") || "";
    this.editor.setSelectionRange(0,0);
    this.refreshLineNumbers();
  }
  refreshLineNumbers(){
    var previousCount = this.getAttribute("line-count") || 0, count = (this.editor.value.match(/\n/g) || []).length + 1, difference = count - previousCount;
    if (difference == 0) return;
    if (difference > 0){
      var fragment = new DocumentFragment(), lineNumber = document.createElement("li");
      lineNumber.part = "line-number";
      for (var i = 0; i < difference; i++) fragment.appendChild(lineNumber.cloneNode());
      this.gutter.appendChild(fragment);
    }
    if (difference < 0) for (var i = 0; i < Math.abs(difference); i++) this.gutter.lastChild.remove();
    this.setAttribute("line-count",count);
    this.refreshScrollPosition();
  }
  getCharacterIndexes(character){
    var list = [], i = -1;
    while ((i = this.editor.value.indexOf(character,i + 1)) >= 0) list.push(i + 1);
    return list;
  }
  getLineIndexes(){
    var indexes = this.getCharacterIndexes("\n");
    indexes.unshift(0);
    return indexes;
  }
  refreshScrollPosition(){
    var { offsetWidth, offsetHeight, clientWidth, clientHeight, scrollWidth, scrollHeight, scrollLeft, scrollTop } = this.editor;
    var scrollbarWidth = offsetWidth - clientWidth, scrollbarHeight = offsetHeight - clientHeight, overscrollX = (scrollLeft < 0 || (clientWidth + scrollLeft) > scrollWidth) ? (scrollLeft < 0) ? scrollLeft : (clientWidth + scrollLeft) - scrollWidth : false, overscrollY = (scrollTop < 0 || (clientHeight + scrollTop) > scrollHeight) ? (scrollTop < 0) ? scrollTop : (clientHeight + scrollTop) - scrollHeight : false;
    (scrollbarWidth > 0) ? this.container.style.setProperty("--overflow-offset-x",`${scrollbarWidth}px`) : this.container.style.removeProperty("--overflow-offset-x");
    (scrollbarHeight > 0) ? this.container.style.setProperty("--overflow-offset-y",`${scrollbarHeight}px`) : this.container.style.removeProperty("--overflow-offset-y");
    if (overscrollX == false){
      this.container.style.removeProperty("--overscroll-left");
      this.container.style.removeProperty("--overscroll-right");
    } else (overscrollX < 0) ? this.container.style.setProperty("--overscroll-left",`${Math.abs(overscrollX)}px`) : this.container.style.setProperty("--overscroll-right",`${overscrollX}px`);
    if (overscrollY == false){
      this.container.style.removeProperty("--overscroll-top");
      this.container.style.removeProperty("--overscroll-bottom");
    } else (overscrollY < 0) ? this.container.style.setProperty("--overscroll-top",`${Math.abs(overscrollY)}px`) : this.container.style.setProperty("--overscroll-bottom",`${overscrollY}px`);
    if (this.gutter.scrollTop != scrollTop) this.gutter.scrollTop = scrollTop;
  }
}
window.customElements.define("num-text",NumTextElement);