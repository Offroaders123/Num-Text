// @ts-check

import { NumText } from "../dist/index.js";

const editor = /** @type { NumText } */ (document.querySelector("num-text"));

editor.value = document.documentElement.outerHTML;