// @ts-check
/// <reference types="../"/>

const thingo = document.createElement("num-text");

await NumText.themes.define("gg",{
  url: new URL("../gg.css")
});

await NumText.themes.define("vsc",{
  content: "[part='container'] { background: red; }"
});

const styles = await fetch("../gg.css")
  .then(response => response.text());

await NumText.themes.update({ name: "gg", content: styles });

if (NumText.themes.has("gg")){
  NumText.themes.remove("gg");
}

const goofyTemplate = document.createElement("template");
goofyTemplate.innerHTML = `
  <style num-text-theme="goofy-theme">
    :host {
      background: lawngreen;
    }
  </style>
`;

await NumText.themes.define("goofy-theme",{
  template: goofyTemplate
});

thingo.colorScheme.set("light");
thingo.colorScheme.toggle();

thingo.themes.add("vsc");
thingo.themes.disable("vsc");
thingo.themes.active("vsc");
thingo.themes.toggle("vsc");

thingo.syntaxHighlight.active();
thingo.syntaxHighlight.enable();

thingo.syntaxLanguage = "html";

thingo.container;
thingo.gutter;
thingo.content;
thingo.syntax;
thingo.editor;

thingo.refreshLineNumbers();
thingo.refreshSyntaxOverlay();
thingo.refreshScrollPosition();

export {};