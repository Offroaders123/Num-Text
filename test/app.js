// @ts-check

import { NumTextElement } from "../src/index.js";

const editor = /** @type { NumTextElement } */ (document.querySelector("num-text"));

editor.value = document.documentElement.outerHTML;