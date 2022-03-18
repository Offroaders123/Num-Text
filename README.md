# Num Text Component

A simple Web Component that adds line numbers and syntax highlighting to the default textarea element!

There are already plenty of code editors out there made for the browser, like [CodeMirror](https://codemirror.net) or [Monaco Editor](https://microsoft.github.io/monaco-editor), but they had more features than what I needed for my own projects, the main one being [Smart Text Editor](https://stedit.app). I decided to go ahead and make my own!

## Getting Started
Thanks to the powerful [Web Components API](https://developer.mozilla.org/en-US/docs/Web/Web_Components), it's possible to create your own HTML elements that abstract away in-depth functionality that may otherwise be hard to work with manually. No need to import any stylesheets, or make any JavaScript calls. Just import the component's source into your page, and let the browser handle the rest!

### Creating a Num Text Element
To use a `<num-text>` element in your own page, follow the steps written below:

1. Add the component's script tag to the `<head>` of your page. This will register the component as a custom element that you will be able to use in your HTML and JavaScript.

    ```html
    <script src="https://offroaders123.github.io/Num-Text-Component/script.js"></script>
    ```

2. Add a `<num-text>` element to the page using any of the ways you would for a default HTML element. Now you are ready to start editing!

    ```html
    <!-- Add it directly to your HTML -->

    <num-text></num-text>
    ```
    ```javascript
    /*  Or create it with JavaScript  */

    const editor = document.createElement("num-text");
    ```

### Styling a Num Text Element
Changing the default styles of a `<num-text>` element is fairly simple! Check out how to customize each part of the component's appearance:

```html
<!-- Component structure -->

<num-text>
  <!-- #shadow-root (open) -->

    <style num-text-theme="vanilla-layout" num-text-theme-type="user-agent">
      /* Minimum default component styles */
    </style>

    <style num-text-theme="vanilla-appearance" num-text-theme-type="any">
      /* Additional appearance styles */
    </style>

    <style num-text-theme="vanilla-highlighting" num-text-theme-type="syntax-highlight">
      /* Num Text's vanilla Prism theme styles */
    </style>

    <div part="container">

      <ol part="gutter">
        <li part="line-number">
          <!--
            ::before (Visible line number and it's surrounding padding)
          -->
        </li>
      </ol>

      <div part="content">
        <pre part="syntax">
          <!-- Prism syntax highlighting populates here -->
        </pre>
        <textarea part="editor"></textarea>
      </div>

    </div>

</num-text>
```

*More coming soon!*