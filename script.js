window.NumText = {
  themes: {
    entries: {},
    define: (name,{ type = "any", url, template, content = "" } = {}) => {
      if (NumText.themes.has(name)) return console.error(new ReferenceError(`Could not define theme "${name}", as it has already been defined in the global NumText object. If you would like to update an existing theme's content, use NumText.themes.update() instead.`));
      var stylesheet = document.createElement("style");
      stylesheet.setAttribute("num-text-theme",name);
      stylesheet.setAttribute("num-text-theme-type",type);
      if (!url) stylesheet.textContent = NumText.themes._tempBackwardsCompatibility_((template) ? template.content.querySelector(`[num-text-theme="${name}"]`).textContent : content);
      NumText.themes.entries[name] = { type, ...url && {url}, stylesheet, elements: [] };
      if (url) NumText.themes.update({ name, url });
    },
    update: async ({ name, url, content } = {}) => {
      if (!NumText.themes.has(name)) return console.error(new ReferenceError(`Could not update theme "${name}", as it has not been defined in the global NumText object.`));
      if (!url && content == undefined) return console.error(new ReferenceError(`Could not update theme "${name}". Please provide a stylesheet URL or CSS content.`));
      if (url) content = await NumText.themes.fetch((url == "refresh") ? NumText.themes.entries[name].url : url);
      content = NumText.themes._tempBackwardsCompatibility_(content);
      NumText.themes.entries[name].stylesheet.textContent = content;
      NumText.themes.entries[name].elements.forEach(element => element.themes.entries[name].stylesheet.textContent = content);
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
      if (!NumText.themes.has(name)) return console.error(new ReferenceError(`Could not remove theme "${name}", as it has not been defined in the global NumText object.`));
      NumText.themes.entries[name].elements.forEach(element => element.themes.remove(name));
      delete NumText.themes.entries[name];
    },
    has: name => (name in NumText.themes.entries)
  },
	languages: {
		JAVASCRIPT: "javascript",
		HTML: "html",
		CSS: "css",
		JSON: "json",
	}
};
NumText.themes.define("vanilla-layout",{
  type: "user-agent",
  url: "https://offroaders123.github.io/Num-Text-Component/vanilla-layout.css"
});
NumText.themes.define("vanilla-appearance",{
  url: "https://offroaders123.github.io/Num-Text-Component/vanilla-appearance.css"
});
NumText.themes.define("vanilla-highlighting",{
  type: "syntax-highlight",
  url: "https://offroaders123.github.io/Num-Text-Component/vanilla-highlighting.css"
});
class NumTextElement extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({ mode: "open" });
    this.defined = false;
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
      get: () => (!this.matches(".color-scheme-dark")) ? "light" : "dark"
    },
    this.themes = {
      entries: {},
      add: name => {
        if (!NumText.themes.has(name)) return console.error(new ReferenceError(`Cound not add theme "${name}" to ${this}, as it has not been defined in the global NumText object.`));
        if (this.themes.has(name)) return;
        var { type, stylesheet } = NumText.themes.entries[name];
        if (type == "syntax-highlight") this.themes.getAll("syntax-highlight").forEach(theme => this.themes.remove(theme));
        this.themes.entries[name] = { type, stylesheet: stylesheet.cloneNode(true), active: true };
        if (type == "syntax-highlight" && !this.matches("[syntax-highlight]")) this.themes.disable(name);
        this.shadowRoot.insertBefore(this.themes.entries[name].stylesheet,this.container);
        NumText.themes.entries[name].elements.push(this);
      },
      remove: name => {
        if (!this.themes.has(name)) return console.error(new ReferenceError(`Could not remove theme "${name}", as it has not been added to ${this}.`));
        this.shadowRoot.removeChild(this.themes.entries[name].stylesheet);
        delete this.themes.entries[name];
        NumText.themes.entries[name].elements.splice(NumText.themes.entries[name].elements.indexOf(this));
      },
      has: name => (name in this.themes.entries),
      enable: name => {
        if (!this.themes.has(name)) return console.error(new ReferenceError(`Could not enable theme "${name}", as it has not been added to ${this}.`));
        this.themes.entries[name].active = true;
        this.themes.entries[name].stylesheet.removeAttribute("media");
      },
      disable: name => {
        if (!this.themes.has(name)) return console.error(new ReferenceError(`Could not disable theme "${name}", as it has not been added to ${this}.`));
        this.themes.entries[name].active = false;
        this.themes.entries[name].stylesheet.media = "not all";
      },
      active: name => {
        if (!this.themes.has(name)) return;
        return this.themes.entries[name].active;
      },
      toggle: name => {
        if (!this.themes.has(name)) return console.error(new ReferenceError(`Could not toggle theme "${name}", as it has not been added to ${this}.`));
        (!this.themes.active(name)) ? this.themes.enable(name) : this.themes.disable(name);
        return this.themes.active(name);
      },
      getAll: type => Object.keys(this.themes.entries).filter(theme => (!type) ? (this.themes.entries[theme].type != "user-agent") : type == this.themes.entries[theme].type)
    };
    this.syntaxHighlight = {
      enable: () => {
        this.setAttribute("syntax-highlight","");
        this.themes.getAll("syntax-highlight").forEach(theme => this.themes.enable(theme));
        this.refreshSyntaxOverlay();
        this.refreshScrollPosition();
      },
      disable: () => {
        this.removeAttribute("syntax-highlight");
        this.themes.getAll("syntax-highlight").forEach(theme => this.themes.disable(theme));
      },
      active: () => this.matches("[syntax-highlight]"),
      toggle: () => (!this.syntaxHighlight.active()) ? this.syntaxHighlight.enable() : this.syntaxHighlight.disable()
    };
    this.formatting = {
			enable: () => {
				this.setAttribute("format", true);
			},
			disable: () => {
				this.removeAttribute("format");
			},
			active: () => this.hasAttribute("format"),
			toggle: () => {
				!this.formatting.active()
					? this.formatting.enable()
					: this.formatting.disable();
			},
			language: {
				set: (language) => {
					this.setAttribute("format-language", language);
				},
				get: () => this.getAttribute("format-language"),
			},
		};
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
    this.syntax = document.createElement("pre");
    this.syntax.part = "syntax";
    this.syntax.style.tabSize = "4";
    this.editor = document.createElement("textarea");
    this.editor.part = "editor";
    this.editor.placeholder = this.getAttribute("placeholder") || "";
    this.editor.wrap = "off";
    this.editor.spellcheck = false;
    this.editor.autocomplete = "off";
    this.editor.autocapitalize = "none";
    this.editor.setAttribute("autocorrect","off");
    this.editor.style.tabSize = "4";
			var beforeInput = (e) => {
				String.prototype.reverse = function () {
					return this.split("").reverse().join("");
				};
				var ta = this.editor;
				if (!ta._lastValue) ta._lastValue = [];
				if (!ta._lastPosition) ta._lastPosition = [];
				if (!ta._history) ta._history = 0;
				var lang = this.formatting.language.get(),
					enabled = this.formatting.active();
				e.preventDefault();
				var type = e.inputType.toString().toLowerCase(),
					value = e.data,
					pos = 0,
					before = ta.value.substr(0, ta.selectionStart),
					after = ta.value.substr(ta.selectionEnd),
					prevChar = before.substr(before.length - 1),
					nextChar = after.substr(0, 1),
					scope = this;
				function getIndents() {
					var indexes = scope.getLineIndexes();
					var linePos = indexes[indexes.length - 1],
						line = before.substring(
							linePos,
							ta.value.indexOf("\n", linePos) - 1
						);
					line = line
						.toString()
						.split("\n")
						[line.toString().split("\n").length - 1].toString();
					return (line.match(/[\t]/gis) || []).length;
				}
				if (
					before.lastIndexOf("<script>\n") >
						before.lastIndexOf("</script>") &&
					-1 < after.indexOf("</script>") &&
					after.indexOf("</script>") > after.indexOf("<script>\n")
				) {
					lang = NumText.languages.JAVASCRIPT;
				} else if (
					before.lastIndexOf("<style>\n") >
						before.lastIndexOf("</style>") &&
					-1 < after.indexOf("</style>") &&
					after.indexOf("</style>") > after.indexOf("<style>\n")
				) {
					lang = NumText.languages.CSS;
				}
				if (type.match(/insert/gis) && !type.match(/line/gis)) {
					ta._lastPosition = ta._lastPosition.splice(
						ta._history,
						ta._lastPosition.length - ta._history
					);
					ta._lastValue = ta._lastValue.splice(
						ta._history,
						ta._lastValue.length - ta._history
					);
					ta._history = 0;
					ta._lastValue.unshift(ta.value);
					ta._lastPosition.unshift({
						start: ta.selectionStart,
						end: ta.selectionEnd,
					});
					if (!(!lang || !enabled)) {
						if (value == ")" && nextChar == ")") {
							value = "";
							pos = 1;
						} else if (value == "}" && nextChar == "}") {
							value = "";
							pos = 1;
						} else if (value == "]" && nextChar == "]") {
							value = "";
							pos = 1;
						} else if (value == "'" && nextChar == "'") {
							value = "";
							pos = 1;
						} else if (value == '"' && nextChar == '"') {
							value = "";
							pos = 1;
						} else if (value == "`" && nextChar == "`") {
							value = "";
							pos = 1;
						}
						if (value == "(") {
							value = "()";
							pos = -1;
						} else if (value == "{") {
							value = "{}";
							pos = -1;
						} else if (value == "[") {
							value = "[]";
							pos = -1;
						} else if (value == "'") {
							value = "''";
							pos = -1;
						} else if (value == '"') {
							value = '""';
							pos = -1;
						} else if (value == "`") {
							value = "``";
							pos = -1;
						}
						if (lang == NumText.languages.HTML) {
							if (value == ">") {
								function checkTag(tag) {
									var holder = document.createElement("div");
									if (tag.match(/doctype/gis)) {
										return {
											selfClosing:
												!holder.innerHTML.match(
													/\<\//gis
												)
													? true
													: false,
											doctype: tag.match(/doctype/gis)
												? true
												: false,
										};
									}
									var elm = document.createElement(tag);
									holder.appendChild(elm);
									return {
										selfClosing: !holder.innerHTML.match(
											/\<\//gis
										)
											? true
											: false,
										doctype: tag.match(/doctype/gis)
											? true
											: false,
									};
								}
								var wholeTag =
									before.split("<")[
										before.split("<").length - 1
									];
								if (
									!wholeTag.match(/\>/gis) &&
									wholeTag != ""
								) {
									var tag = wholeTag.split(/ +/gis)[0];
									var tagCheck = checkTag(tag);
									if (
										tagCheck.selfClosing &&
										!tagCheck.doctype
									) {
										value = " />";
									} else if (!tagCheck.doctype) {
										value = "></" + tag + ">";
										pos = -(3 + tag.length);
									} else {
										value = ">";
									}
								}
							}
						} else if (lang == NumText.languages.JAVASCRIPT) {
							if (
								value == "n" &&
								before.substr(before.length - 4) == "--fn"
							) {
								ta.selectionStart -= 4;
								value = "function() {}";
								pos = -1;
							} else if (
								value == "c" &&
								before.substr(before.length - 4) == "--fn"
							) {
								ta.selectionStart -= 4;
								value = "function () {}";
								pos = -5;
							} else if (
								value == "a" &&
								before.substr(before.length - 4) == "--fn"
							) {
								ta.selectionStart -= 4;
								value = `(() => {\n${"\t".repeat(
									getIndents() + 1
								)}\n${"\t".repeat(getIndents())}})();`;
								pos = -(5 + getIndents() + 1);
							} else if (
								value == "r" &&
								before.substr(before.length - 4) == "--fn"
							) {
								ta.selectionStart -= 4;
								value = `() => {\n${"\t".repeat(
									getIndents() + 1
								)}\n${"\t".repeat(getIndents())}}`;
								pos = -(1 + getIndents() + 1);
							}
						}
					}
				} else if (type.match(/line/gis)) {
					ta._lastValue.unshift(ta.value);
					ta._lastPosition.unshift({
						start: ta.selectionStart,
						end: ta.selectionEnd,
					});
					value = "\n";
					if (!(!lang || !enabled)) {
						if (lang == NumText.languages.HTML) {
							value = "\n" + "\t".repeat(getIndents());
							if (prevChar == ">" && nextChar == "<") {
								value =
									"\n" +
									"\t".repeat(getIndents() + 1) +
									"\n" +
									"\t".repeat(getIndents());
								pos = -1 - getIndents();
							}
						} else if (
							lang == NumText.languages.JAVASCRIPT ||
							lang == NumText.languages.CSS ||
							lang == NumText.languages.JSON
						) {
							value = "\n" + "\t".repeat(getIndents());
							if (prevChar == "{" && nextChar == "}") {
								value =
									"\n" +
									"\t".repeat(getIndents() + 1) +
									"\n" +
									"\t".repeat(getIndents());
								pos = -1 - getIndents();
							}
							if (prevChar == "[" && nextChar == "]") {
								value =
									"\n" +
									"\t".repeat(getIndents() + 1) +
									"\n" +
									"\t".repeat(getIndents());
								pos = -1 - getIndents();
							}
						}
					}
				} else if (type.match(/delete/gis)) {
					ta._lastValue.unshift(ta.value);
					ta._lastPosition.unshift({
						start: ta.selectionStart,
						end: ta.selectionEnd,
					});
					var selection = ta.value.substring(
						ta.selectionStart,
						ta.selectionEnd
					);
					if (selection.length == 0) ta.selectionStart -= 1;
					selection = ta.value.substring(
						ta.selectionStart,
						ta.selectionEnd
					);
					value = "";
					if (!(!lang || !enabled)) {
						if (selection == "[" && nextChar == "]") {
							ta.selectionEnd += 1;
						}
						if (selection == "(" && nextChar == ")") {
							ta.selectionEnd += 1;
						}
						if (selection == "{" && nextChar == "}") {
							ta.selectionEnd += 1;
						}
						if (selection == "'" && nextChar == "'") {
							ta.selectionEnd += 1;
						}
						if (selection == "`" && nextChar == "`") {
							ta.selectionEnd += 1;
						}
						if (selection == '"' && nextChar == '"') {
							ta.selectionEnd += 1;
						}
					}
					document.execCommand("delete", null, false);
				} else if (type.match(/undo/gis)) {
					ta._lastValue.unshift(ta.value);
					value = "";
					ta._history++;
					document.execCommand("undo", null, false);
					if (mobileAndTabletCheck()) {
						ta.value = ta._lastValue[ta._history];
					}
					ta.selectionStart =
						(ta._lastPosition[ta._history] || { start: 0 }).start +
						1;
					ta.selectionEnd =
						(ta._lastPosition[ta._history] || { end: 0 }).end + 1;
				} else if (type.match(/redo/gis)) {
					value = "";
					document.execCommand("redo", null, false);
					ta._history--;
					if (ta._history < 0) ta._history = 0;
					if (mobileAndTabletCheck()) {
						ta.value = ta._lastValue[ta._history];
					}
					ta.selectionStart =
						(ta._lastPosition[ta._history] || { start: 0 }).start +
						1;
					ta.selectionEnd =
						(ta._lastPosition[ta._history] || { end: 0 }).end + 1;
				} else {
					value = "";
				}
				if (value.length > 0)
					document.execCommand("insertText", false, value);
				ta.selectionStart += pos;
				if (pos != 0) ta.selectionEnd = ta.selectionStart;
				this.refreshLineNumbers();
			};
			this.editor.addEventListener("keydown", (e) => {
				if (e.key.toUpperCase() == "TAB") {
					e.preventDefault();
					e.data = "\t";
					e.inputType = "insertText";
					beforeInput(e);
				}
			});
			this.editor.addEventListener("beforeinput", beforeInput);
    this.editor.addEventListener("scroll",() => this.refreshScrollPosition(),{ passive: true });
    new ResizeObserver(() => {
      this.style.removeProperty("width");
      this.style.height = `${this.offsetHeight - this.clientHeight + parseInt(this.editor.style.height,10)}px`;
      this.editor.style.removeProperty("height");
      this.refreshScrollPosition();
    }).observe(this.editor);
    this.shadowRoot.appendChild(this.container);
    this.themes.add("vanilla-layout");
    this.themes.add("vanilla-appearance");
    this.themes.add("vanilla-highlighting");
    if (this.matches("[themes]")) this.getAttribute("themes").split(" ").forEach(theme => this.themes.add(theme));
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
    if (!this.matches("[syntax-highlight][syntax-language]")) return;
    var tokened = this.editor.value;
    if (tokened[tokened.length - 1] == "\n") tokened += "\n";
    if (!("Prism" in window)) return console.error(`Could not refresh syntax overlay for ${this}, as Prism has not been loaded into the document.`);
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
    if (!this.matches("[syntax-language]")) return;
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
  replace(pattern,value){
    var replaced = this.editor.value.replace(pattern,value);
    if (replaced != this.editor.value) this.value = replaced;
  }
  focus({ preventScroll = false } = {}){
    this.editor.focus({ preventScroll });
  }
  blur(){
    this.editor.blur();
  }
  get syntaxLanguage(){
    return this.getAttribute("syntax-language");
  }
  set syntaxLanguage(language){
    this.setAttribute("syntax-language",language);
    this.refreshLineNumbers();
  }
  get value(){
    return this.editor.value;
  }
  set value(content){
    var active = document.activeElement;
    if (active != this.editor) this.focus({ preventScroll: true });
    this.editor.select();
    document.execCommand("insertText",null,content);
    if (active != this.editor) active.focus({ preventScroll: true });
    return content;
  }
  get disabled(){
    return this.editor.disabled;
  }
  set disabled(state){
    (state) ? this.setAttribute("disabled","") : this.removeAttribute("disabled");
    this.editor.disabled = state;
  }
  get readonly(){
    return this.editor.readonly;
  }
  set readonly(state){
    (state) ? this.setAttribute("readonly","") : this.removeAttribute("readonly");
    this.editor.readOnly = state;
  }
}
window.customElements.define("num-text",NumTextElement);
