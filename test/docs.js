// @ts-check
/// <reference types="../"/>

const thingo = document.createElement("num-text");

NumText.themes.define("gg");

NumText.themes.define("vsc",{
  content: ""
});

const styles = await fetch("../gg.css")
  .then(response => response.text());

await NumText.themes.update({ name: "gg", content: styles });

if (NumText.themes.has("gg")){
  NumText.themes.remove("gg");
}

thingo.colorScheme.set("light");
thingo.colorScheme.toggle();

thingo.themes.add("vsc");
thingo.themes.disable("vsc");
thingo.themes.active("vsc");
thingo.themes.toggle("vsc");

thingo.syntaxHighlight.active();
thingo.syntaxHighlight.enable();

thingo.syntaxLanguage = "html";

export {};