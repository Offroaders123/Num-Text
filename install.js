var install = document.querySelector("[src='https://offroaders123.github.io/Numbered-Textarea-Plugin/install.js']");
var script = document.createElement("script");
script.src = "https://offroaders123.github.io/Numbered-Textarea-Plugin/script.js";
script.defer = true;
install.parentElement.insertBefore(script,install.nextSibling);
var styles = document.createElement("link");
styles.href = "https://offroaders123.github.io/Numbered-Textarea-Plugin/styles.css";
styles.rel = "stylesheet";
install.parentElement.insertBefore(styles,install.nextSibling);