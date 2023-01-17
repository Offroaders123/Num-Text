// @ts-check

import { NumTextElement } from "../dist/index.js";

const editor = /** @type { NumTextElement } */ (document.querySelector("num-text"));

editor.value = document.documentElement.outerHTML;