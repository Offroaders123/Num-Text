window.NumText = {
  themes: {
    entries: {},
    define: ({ name, type = "any", url, template, content = "" } = {}) => {
      if (NumText.themes.has(name)) throw new ReferenceError(`Could not define theme "${name}", as it has already been defined in the global NumText object. If you would like to update an existing theme's content, use NumText.themes.update() instead.`);
      var stylesheet = document.createElement("style");
      stylesheet.setAttribute("num-text-theme",name);
      stylesheet.setAttribute("num-text-theme-type",type);
      if (!url) stylesheet.textContent = NumText.themes._tempBackwardsCompatibility_((template) ? template.content.querySelector(`[num-text-theme="${name}"]`).textContent : content);
      NumText.themes.entries[name] = { type, ...url && {url}, stylesheet };
      if (url) NumText.themes.update({ name, url });
    },
    update: async ({ name, url, content } = {}) => {
      if (!NumText.themes.has(name)) throw new ReferenceError(`Could not update theme "${name}", as it has not yet been defined in the global NumText object.`);
      if (!url && content == undefined) throw new ReferenceError(`Could not update theme "${name}". Please provide a stylesheet URL or CSS content.`);
      if (url) content = await NumText.themes.fetch((url == "refresh") ? NumText.themes.entries[name].url : url);
      content = NumText.themes._tempBackwardsCompatibility_(content);
      NumText.themes.entries[name].stylesheet.textContent = content;
      document.querySelectorAll("num-text").forEach(element => {
        if (name in element.themes.entries) element.themes.entries[name].stylesheet.textContent = content;
      });
    },
    fetch: async url => {
      var response = await fetch(url);
      return await response.text();
    },
    _tempBackwardsCompatibility_: content => {
      if (CSS.supports("not selector(:is())")) content = content.replace(/:is\(/g,":-webkit-any(");
      if (CSS.supports("not selector(:where())")) content = content.replace(/:where\(/g,":-webkit-any(");
      return content;
    },
    remove: name => {
      if (!NumText.themes.has(name)) throw new ReferenceError(`Could not remove theme "${name}", as it has not yet been defined in the global NumText object.`);
      document.querySelectorAll("num-text").forEach(element => {
        if (name in element.themes.entries) element.themes.remove(name);
      });
      delete NumText.themes.entries[name];
    },
    has: name => (name in NumText.themes.entries)
  }
};
NumText.themes.define({
  name: "default-layout",
  template: shadow_styles
});
NumText.themes.define({
  name: "default-appearance",
  content: document.querySelector("#shadow_styles").content.querySelector("[num-text-theme='default-appearance']").textContent
});
NumText.themes.define({
  name: "default-highlighting",
  type: "syntax-highlight",
  template: shadow_styles
});
NumText.themes.define({
  name: "vsc-dark-plus",
  type: "syntax-highlight",
  url: "https://cdn.jsdelivr.net/npm/prism-themes@1.7.0/themes/prism-vsc-dark-plus.css"
});
class NumTextElement extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({ mode: "open" });
    this.colorScheme = {
      set: appearance => {
        var state = this.colorScheme.get();
        if (appearance == state) return state;
        if (appearance == "light") this.classList.remove("color-scheme-dark");
        if (appearance == "dark") this.classList.add("color-scheme-dark");
        return this.colorScheme.get();
      },
      toggle: () => {
        this.classList.toggle("color-scheme-dark");
        return this.colorScheme.get();
      },
      get: () => (!this.classList.contains("color-scheme-dark")) ? "light" : "dark"
    },
    this.themes = {
      entries: {},
      add: name => {
        if (!NumText.themes.has(name)) throw new ReferenceError(`Cound not add theme "${name}" to ${this}, as it has not yet been defined in the global NumText object.`);
        if (this.themes.has(name)) return;
        var { type, stylesheet } = NumText.themes.entries[name];
        this.themes.entries[name] = { type, active: true, stylesheet: stylesheet.cloneNode(true) };
        if (!this.hasAttribute("syntax-highlight") && type == "syntax-highlight") this.themes.disable(name);
        this.container.appendChild(this.themes.entries[name].stylesheet);
      },
      remove: name => {
        if (!this.themes.has(name)) return;
        this.container.removeChild(this.themes.entries[name].stylesheet);
        delete this.themes.entries[name];
      },
      has: name => (name in this.themes.entries),
      enable: name => {
        if (!this.themes.has(name)) throw new ReferenceError(`Could not enable theme "${name}", as it has not yet been added to ${this}.`);
        this.themes.entries[name].active = true;
        this.themes.entries[name].stylesheet.removeAttribute("media");
      },
      disable: name => {
        if (!this.themes.has(name)) return;
        this.themes.entries[name].active = false;
        this.themes.entries[name].stylesheet.media = "not all";
      },
      active: name => {
        if (!this.themes.has(name)) return;
        return this.themes.entries[name].active;
      },
      toggle: name => {
        if (!this.themes.has(name)) throw new ReferenceError(`Could not toggle theme "${name}", as it has not yet been added to ${this}.`);
        (!this.themes.active(name)) ? this.themes.enable(name) : this.themes.disable(name);
        return this.themes.active(name);
      },
      getAll: type => Array.from(this.container.querySelectorAll(`style${(type) ? `[num-text-theme-type="${type}"]` : ""}`)).map(stylesheet => stylesheet.getAttribute("num-text-theme"))
    };
    this.syntaxHighlight = {
      enable: () => {
        this.setAttribute("syntax-highlight",true);
        this.themes.getAll("syntax-highlight").forEach(theme => this.themes.enable(theme));
        this.refreshSyntaxOverlay();
        this.refreshScrollPosition();
      },
      disable: () => {
        this.removeAttribute("syntax-highlight");
        this.themes.getAll("syntax-highlight").forEach(theme => this.themes.disable(theme));
      },
      active: () => this.hasAttribute("syntax-highlight"),
      toggle: () => (!this.syntaxHighlight.active()) ? this.syntaxHighlight.enable() : this.syntaxHighlight.disable(),
      language: {
        set: language => {
          this.setAttribute("syntax-language",language);
          this.refreshLineNumbers();
        },
        get: () => this.getAttribute("syntax-language")
      }
    };
  }
  connectedCallback(){
    this.addEventListener("mousedown",event => {
      var target = event.composedPath()[0];
      if (target == this.editor) return;
      event.preventDefault();
      this.editor.focus({ preventScroll: (!this.gutter.contains(target)) });
    });
    this.container = document.createElement("div");
    this.container.part = "container";
    this.gutter = document.createElement("ol");
    this.gutter.part = "gutter";
    this.gutter.addEventListener("mousedown",event => {
      var index = this.getLineIndexes()[Array.from(this.gutter.children).indexOf(event.target)];
      this.editor.setSelectionRange(index,index);
      this.editor.blur();
    });
    this.gutter.addEventListener("dblclick",event => {
      var indexes = this.getLineIndexes(), line = Array.from(this.gutter.children).indexOf(event.target);
      this.editor.setSelectionRange(indexes[line],(line + 1 in indexes) ? indexes[line + 1] : this.editor.value.length);
    });
    this.gutter.addEventListener("scroll",() => this.refreshScrollPosition(),{ passive: true });
    this.content = document.createElement("div");
    this.content.part = "content";
    this.syntax = document.createElement("pre");
    this.syntax.part = "syntax";
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
    this.themes.add("default-layout");
    this.themes.add("default-appearance");
    this.themes.add("default-highlighting");
    this.container.appendChild(this.gutter);
    this.container.appendChild(this.content);
    this.content.appendChild(this.syntax);
    this.content.appendChild(this.editor);
    this.disabled = this.matches("[disabled]");
    this.readonly = this.matches("[readonly]");
    this.editor.value = this.getAttribute("value") || "";
    this.editor.setSelectionRange(0,0);
    this.refreshLineNumbers();
  }
  refreshLineNumbers(){
    this.refreshSyntaxOverlay();
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
  refreshSyntaxOverlay(){
    if (!this.hasAttribute("syntax-highlight") || !this.hasAttribute("syntax-language")) return;
    var tokened = this.editor.value;
    if (tokened[tokened.length - 1] == "\n") tokened += "\n";
    this.syntax.innerHTML = Prism.highlight(tokened,Prism.languages[this.getAttribute("syntax-language")]);
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
    if (!this.hasAttribute("syntax-language")) return;
    if (this.syntax.scrollLeft != scrollLeft) this.syntax.scrollLeft = scrollLeft;
    if (this.syntax.scrollTop != scrollTop) this.syntax.scrollTop = scrollTop;
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
  get value(){
    return this.editor.value;
  }
  set value(content){
    var active = document.activeElement;
    if (active != this.editor) this.editor.focus({ preventScroll: true });
    this.editor.select();
    document.execCommand("insertText",null,content);
    if (active != this.editor) active.focus({ preventScroll: true });
    return content;
  }
  get disabled(){
    return this.editor.disabled;
  }
  set disabled(state){
    (state) ? this.setAttribute("disabled",true) : this.removeAttribute("disabled");
    this.editor.disabled = state;
  }
  get readonly(){
    return this.editor.readonly;
  }
  set readonly(state){
    (state) ? this.setAttribute("readonly",true) : this.removeAttribute("readonly");
    this.editor.readOnly = state;
  }
}
window.customElements.define("num-text",NumTextElement);