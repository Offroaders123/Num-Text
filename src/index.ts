type NumTextThemeType = "any" | "syntax-highlight" | "user-agent";

interface NumTextTheme {
  /**
   * Defines whether the theme should be used for regular styling, syntax highlighting, or is a built-in theme provided by Num Text.
  */
  type: NumTextThemeType;
  url?: string;
  stylesheet: HTMLStyleElement;
}

interface NumTextThemeEntry extends NumTextTheme {
  elements: NumTextElement[];
}

interface NumTextThemeEntries {
  [name: string]: NumTextThemeEntry;
}

interface NumTextDefineThemeOptions {
  /**
   * Defines whether the theme should be used for regular styling, syntax highlighting, or is a built-in theme provided by Num Text.
  */
  type?: NumTextThemeType;
  url?: string;
  template?: HTMLTemplateElement;
  content?: string;
}

interface NumTextUpdateThemeOptions {
  name: string;
  url?: string;
  content?: string | null;
}

type NumTextColorScheme = "light" | "dark";

interface NumTextLocalTheme extends NumTextTheme {
  active: boolean;
}

interface NumTextLocalThemes {
  [name: string]: NumTextLocalTheme;
}

var NumText = {
  themes: {
    entries: {} as NumTextThemeEntries,

    /**
     * Creates a new theme definition to be applied to your own Num Text elements.
    */
    define(name: string, { type = "any", url, template, content = "" }: NumTextDefineThemeOptions = {}) {
      if (NumText.themes.has(name)){
        return console.error(new ReferenceError(`Could not define theme "${name}", as it has already been defined in the global NumText object. If you would like to update an existing theme's content, use NumText.themes.update() instead.`));
      }

      const stylesheet = document.createElement("style");
      stylesheet.setAttribute("num-text-theme",name);
      stylesheet.setAttribute("num-text-theme-type",type);

      if (!url){
        stylesheet.textContent = NumText.themes._tempBackwardsCompatibility_(
          (template) ? template.content.querySelector(`[num-text-theme="${name}"]`)!.textContent! : content
        );
      }

      NumText.themes.entries[name] = {
        type,
        ...url && {url},
        stylesheet,
        elements: []
      } as NumTextThemeEntry;

      if (url){
        NumText.themes.update({ name, url });
      }
    },

    /**
     * Updates the stylesheet content for an already defined theme. The changes will be synced to all Num Text elements that have that theme applied.
    */
    async update({ name, url, content = null }: NumTextUpdateThemeOptions) {
      if (!NumText.themes.has(name)){
        return console.error(new ReferenceError(`Could not update theme "${name}", as it has not been defined in the global NumText object.`));
      }
      if (!url && content == undefined){
        return console.error(new ReferenceError(`Could not update theme "${name}". Please provide a stylesheet URL or CSS content.`));
      }
      if (url){
        content = await NumText.themes.fetch((url == "refresh") ? NumText.themes.entries[name].url! : url);
      }

      content = NumText.themes._tempBackwardsCompatibility_(content!);
      NumText.themes.entries[name].stylesheet.textContent = content;

      NumText.themes.entries[name].elements.forEach(element => element.themes.entries[name].stylesheet.textContent = content);
    },

    async fetch(url: string) {
      const response = await fetch(url);
      return await response.text();
    },

    /**
     * This provides a legacy fallback for browsers that don't yet support the `:is()` or `:where()` selectors in CSS, and it will use the `:-webkit-any()` selector instead. This is applied to all themes automatically.
    */
    _tempBackwardsCompatibility_(content: string) {
      if (CSS.supports("not selector(:is())")){
        content = content.replace(/:is\(/g,":-webkit-any(");
      }
      if (CSS.supports("not selector(:where())")){
        content = content.replace(/:where\(/g,":-webkit-any(");
      }
      return content;
    },

    /**
     * Deletes the root theme definition, and removes the theme from all Num Text elements that apply it.
    */
    remove(name: string) {
      if (!NumText.themes.has(name)){
        return console.error(new ReferenceError(`Could not remove theme "${name}", as it has not been defined in the global NumText object.`));
      }

      NumText.themes.entries[name].elements.forEach(element => element.themes.remove(name));
      delete NumText.themes.entries[name];
    },

    /**
     * Checks if a given theme has been defined.
    */
    has(name: string) {
      return (name in NumText.themes.entries);
    }
  }
};

(() => {

const importMetaURL = (document.currentScript! as HTMLScriptElement).src;

NumText.themes.define("vanilla-layout",{
  type: "user-agent",
  url: `${new URL("../styles/vanilla-layout.css",importMetaURL)}`
});

NumText.themes.define("vanilla-appearance",{
  url: `${new URL("../styles/vanilla-appearance.css",importMetaURL)}`
});

NumText.themes.define("vanilla-highlighting",{
  type: "syntax-highlight",
  url: `${new URL("../styles/vanilla-highlighting.css",importMetaURL)}`
});

})();

class NumTextElement extends HTMLElement {
  declare readonly shadowRoot: ShadowRoot;

  #isDefined;
  /**
   * A namespace which manages the color scheme of the element.
  */
  declare readonly colorScheme;
  /**
   * A namespace which manages the themes applied to the element.
  */
  declare readonly themes;
  /**
   * A namespace which manages the syntax highlighting within the editor.
  */
  declare readonly syntaxHighlight;

  declare readonly container;
  declare readonly gutter;
  declare readonly content;
  declare readonly syntax;
  declare readonly editor;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#isDefined = false;

    this.colorScheme = {
      set: (appearance: NumTextColorScheme) => {
        const state = this.colorScheme.get();

        if (appearance == state) return state;
        if (appearance == "light") this.classList.remove("color-scheme-dark");
        if (appearance == "dark") this.classList.add("color-scheme-dark");
        return this.colorScheme.get();
      },

      /**
       * Toggles between the light and dark color schemes.
      */
      toggle: () => {
        this.classList.toggle("color-scheme-dark");
        return this.colorScheme.get();
      },

      get: (): NumTextColorScheme => {
        return (!this.matches(".color-scheme-dark")) ? "light" : "dark";
      }
    },

    this.themes = {
      entries: {} as NumTextLocalThemes,

      /**
       * Adds a defined theme to the element.
       * 
       * Only one syntax highlighting theme can be applied at a time. If one is already applied to the element, it will be removed.
      */
      add: (name: string) => {
        if (!NumText.themes.has(name)){
          return console.error(new ReferenceError(`Cound not add theme "${name}" to ${this}, as it has not been defined in the global NumText object.`));
        }
        if (this.themes.has(name)) return;

        const { type, stylesheet } = NumText.themes.entries[name];

        if (type == "syntax-highlight"){
          this.themes.getAll("syntax-highlight").forEach(theme => this.themes.remove(theme));
        }

        this.themes.entries[name] = {
          type,
          stylesheet: stylesheet.cloneNode(true) as HTMLStyleElement,
          active: true
        } as NumTextLocalTheme;

        if (type == "syntax-highlight" && !this.matches("[syntax-highlight]")){
          this.themes.disable(name);
        }

        this.shadowRoot.insertBefore(this.themes.entries[name].stylesheet,this.container);
        NumText.themes.entries[name].elements.push(this);
      },

      /**
       * Removes an applied theme from the element.
      */
      remove: (name: string) => {
        if (!this.themes.has(name)){
          return console.error(new ReferenceError(`Could not remove theme "${name}", as it has not been added to ${this}.`));
        }

        this.shadowRoot.removeChild(this.themes.entries[name].stylesheet);
        delete this.themes.entries[name];

        NumText.themes.entries[name].elements.splice(NumText.themes.entries[name].elements.indexOf(this));
      },

      /**
       * Checks if a given theme has been applied to the element.
      */
      has: (name: string) => {
        return (name in this.themes.entries);
      },

      /**
       * Re-enables an applied theme which was previously hidden.
      */
      enable: (name: string) => {
        if (!this.themes.has(name)){
          return console.error(new ReferenceError(`Could not enable theme "${name}", as it has not been added to ${this}.`));
        }

        this.themes.entries[name].active = true;
        this.themes.entries[name].stylesheet.removeAttribute("media");
      },

      /**
       * Hides an applied theme in-place.
       * 
       * This is useful for performance if you plan to add it again later, as it won't actually remove it from the element.
      */
      disable: (name: string) => {
        if (!this.themes.has(name)){
          return console.error(new ReferenceError(`Could not disable theme "${name}", as it has not been added to ${this}.`));
        }

        this.themes.entries[name].active = false;
        this.themes.entries[name].stylesheet.media = "not all";
      },

      /**
       * Checks if an applied theme is currently enabled or disabled.
      */
      active: (name: string) => {
        if (!this.themes.has(name)) return;
        return this.themes.entries[name].active;
      },

      /**
       * Toggles the active state of an applied theme, between enabled and disabled.
      */
      toggle: (name: string) => {
        if (!this.themes.has(name)){
          return console.error(new ReferenceError(`Could not toggle theme "${name}", as it has not been added to ${this}.`));
        }

        if (!this.themes.active(name)){
          this.themes.enable(name);
        } else {
          this.themes.disable(name);
        }

        return this.themes.active(name);
      },

      /**
       * Returns an array for all applied themes on the element.
       * 
       * This does not include the built-in theme provided by Num Text.
      */
      getAll: (type: NumTextThemeType) => {
        return Object.keys(this.themes.entries).filter(theme => {
          return (!type) ? (this.themes.entries[theme].type != "user-agent") : type == this.themes.entries[theme].type;
        });
      }
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

      /**
       * Checks if syntax highlighting is currently enabled.
      */
      active: () => {
        return this.matches("[syntax-highlight]");
      },

      toggle: () => {
        if (!this.syntaxHighlight.active()){
          this.syntaxHighlight.enable();
        } else {
          this.syntaxHighlight.disable();
        }
      }
    };

    this.container = document.createElement("div");
    this.gutter = document.createElement("ol");
    this.content = document.createElement("div");
    this.syntax = document.createElement("pre");
    this.editor = document.createElement("textarea");
  }

  connectedCallback() {
    if (this.#isDefined || !this.isConnected) return;
    this.#isDefined = true;

    this.addEventListener("mousedown",event => {
      const target = event.composedPath()[0] as HTMLElement;
      if (target == this.editor) return;

      event.preventDefault();
      this.focus({ preventScroll: (!this.gutter.contains(target)) });
    });

    this.container.part.add("container");

    this.gutter.part.add("gutter");

    this.gutter.addEventListener("mousedown",event => {
      const index = this.getLineIndexes()[Array.from(this.gutter.children).indexOf(event.target as HTMLElement)];

      this.editor.setSelectionRange(index,index);
      this.blur();
    });

    this.gutter.addEventListener("dblclick",event => {
      const indexes = this.getLineIndexes();
      const line = Array.from(this.gutter.children).indexOf(event.target as HTMLElement);

      this.editor.setSelectionRange(indexes[line],(line + 1 in indexes) ? indexes[line + 1] : this.editor.value.length);
    });

    this.gutter.addEventListener("scroll",() => {
      this.refreshScrollPosition();
    },{ passive: true });

    this.content.part.add("content");

    this.syntax.part.add("syntax");

    this.editor.part.add("editor");
    this.editor.placeholder = this.getAttribute("placeholder") || "";
    this.editor.wrap = "off";
    this.editor.spellcheck = false;
    this.editor.autocomplete = "off";
    this.editor.autocapitalize = "none";

    this.editor.setAttribute("autocorrect","off");

    this.editor.addEventListener("input",() => {
      this.refreshLineNumbers();
    });

    this.editor.addEventListener("scroll",() => {
      this.refreshScrollPosition();
    },{ passive: true });

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

    if (this.matches("[themes]")){
      this.getAttribute("themes")!.split(" ").forEach(theme => this.themes.add(theme));
    }

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

  refreshLineNumbers() {
    this.refreshSyntaxOverlay();

    const previousCount = Number(this.getAttribute("line-count") || 0);
    const count = (this.editor.value.match(/\n/g) || []).length + 1;
    const difference = count - previousCount;

    if (difference == 0) return;

    if (difference > 0){
      const fragment = new DocumentFragment();
      const lineNumber = document.createElement("li");

      lineNumber.part.add("line-number");

      for (let i = 0; i < difference; i++){
        fragment.appendChild(lineNumber.cloneNode());
      }
      this.gutter.appendChild(fragment);
    }

    if (difference < 0){
      for (let i = 0; i < Math.abs(difference); i++){
        this.gutter.lastChild?.remove();
      }
    }

    this.setAttribute("line-count",count.toString());
    this.refreshScrollPosition();
  }

  refreshSyntaxOverlay() {
    if (!this.matches("[syntax-highlight][syntax-language]")) return;

    let tokened = this.editor.value;
    if (tokened[tokened.length - 1] == "\n"){
      tokened += "\n";
    }

    if (!("Prism" in window)){
      return console.error(`Could not refresh syntax overlay for ${this}, as Prism has not been loaded into the document.`);
    }

    this.syntax.innerHTML = Prism.highlight(tokened,Prism.languages[this.getAttribute("syntax-language")!],"");
  }

  refreshScrollPosition() {
    const { offsetWidth, offsetHeight, clientWidth, clientHeight, scrollWidth, scrollHeight, scrollLeft, scrollTop } = this.editor;

    const scrollbarWidth = offsetWidth - clientWidth;
    const scrollbarHeight = offsetHeight - clientHeight;

    const overscrollX: number | false =
      (scrollLeft < 0 || (clientWidth + scrollLeft) > scrollWidth)
        ? (scrollLeft < 0)
          ? scrollLeft
          : (clientWidth + scrollLeft) - scrollWidth
        : false;

    const overscrollY: number | false =
      (scrollTop < 0 || (clientHeight + scrollTop) > scrollHeight)
        ? (scrollTop < 0)
          ? scrollTop
          : (clientHeight + scrollTop) - scrollHeight
        : false;

    if (scrollbarWidth > 0){
      this.container.style.setProperty("--overflow-offset-x",`${scrollbarWidth}px`);
    } else {
      this.container.style.removeProperty("--overflow-offset-x");
    }

    if (scrollbarHeight > 0){
      this.container.style.setProperty("--overflow-offset-y",`${scrollbarHeight}px`);
    } else {
      this.container.style.removeProperty("--overflow-offset-y");
    }

    if (overscrollX == false){
      this.container.style.removeProperty("--overscroll-left");
      this.container.style.removeProperty("--overscroll-right");
    } else if (overscrollX < 0){
      this.container.style.setProperty("--overscroll-left",`${Math.abs(overscrollX)}px`);
    } else {
      this.container.style.setProperty("--overscroll-right",`${overscrollX}px`);
    }

    if (overscrollY == false){
      this.container.style.removeProperty("--overscroll-top");
      this.container.style.removeProperty("--overscroll-bottom");
    } else if (overscrollY < 0){
      this.container.style.setProperty("--overscroll-top",`${Math.abs(overscrollY)}px`);
    } else {
      this.container.style.setProperty("--overscroll-bottom",`${overscrollY}px`);
    }

    if (this.gutter.scrollTop != scrollTop){
      this.gutter.scrollTop = scrollTop;
    }

    if (!this.matches("[syntax-language]")) return;

    if (this.syntax.scrollLeft != scrollLeft){
      this.syntax.scrollLeft = scrollLeft;
    }

    if (this.syntax.scrollTop != scrollTop){
      this.syntax.scrollTop = scrollTop;
    }
  }

  /**
   * Returns the numerical indices of a given character (string) within the editor.
  */
  getCharacterIndexes(character: string) {
    const list = [];
    let i = -1;

    while ((i = this.editor.value.indexOf(character,i + 1)) >= 0){
      list.push(i + 1);
    }
    return list;
  }

  /**
   * Returns the numerical indices of the lines within the editor.
  */
  getLineIndexes() {
    const indexes = this.getCharacterIndexes("\n");

    indexes.unshift(0);
    return indexes;
  }

  /**
   * Performs a find and replace for a given pattern or string within the editor.
  */
  replace(pattern: string | RegExp, value: string) {
    const replaced = this.editor.value.replace(pattern,value);

    if (replaced != this.editor.value){
      this.value = replaced;
    }
  }

  focus(options?: FocusOptions) {
    this.editor.focus(options);
  }

  blur() {
    this.editor.blur();
  }

  get defined() {
    return this.#isDefined;
  }

  /**
   * Retrieves or sets the language to use for Prism's syntax highlighting tokenization.
  */
  get syntaxLanguage() {
    return this.getAttribute("syntax-language") ?? "";
  }

  set syntaxLanguage(language: string) {
    this.setAttribute("syntax-language",language);
    this.refreshLineNumbers();
  }

  /**
   * Retrieves or sets the text within the editor.
  */
  get value() {
    return this.editor.value;
  }

  set value(content: string) {
    const active = document.activeElement as HTMLElement;

    if (active != this.editor){
      this.focus({ preventScroll: true });
    }

    this.editor.select();
    document.execCommand("insertText",false,content);

    if (active != this.editor){
      active.focus({ preventScroll: true });
    }
  }

  get disabled() {
    return this.editor.disabled;
  }

  set disabled(state: boolean) {
    if (state){
      this.setAttribute("disabled","");
    } else {
      this.removeAttribute("disabled");
    }
    this.editor.disabled = state;
  }

  /**
   * Retrieves or sets whether the editor is in read-only mode.
  */
  get readonly() {
    return this.editor.readOnly;
  }

  set readonly(state) {
    if (state){
      this.setAttribute("readonly","");
    } else {
      this.removeAttribute("readonly");
    }
    this.editor.readOnly = state;
  }
}

interface HTMLElementTagNameMap {
  "num-text": NumTextElement;
}

window.customElements.define("num-text",NumTextElement);