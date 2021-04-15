<table>
  <tr>
    <td>
      <h1>Num-Text Component</h1>
    </td>
  </tr>
</table>

A simple Web Component that adds line numbers to native textarea elements!

There are many libraries out there that can textareas with line numbers already, but they have many more features that what I needed for my own projects. So, I went ahead and tried to make my own!

## How to Use
Thanks to the amazing [Web Components API](https://developer.mozilla.org/en-US/docs/Web/Web_Components), it is extremely easy to create your own elements that can abstract away in-depth functionality that may otherwise be hard to work with.

### Creating a Num-Text Element
To use a `<num-text>` element in your own page, follow the steps written below:

1. Add the component's script tag to the `<head>` of your page. This will register the custom component with the document, as well as provide all of the behavior that defines how `<num-text>` elements will work.
    ```html
    <script src="https://offroaders123.github.io/Num-Text-Component/script.js"></script>
    ```

2. Add a `<num-text>` element to the page using any of the ways you would for a default element.
    ```html
    <!-- Add it directly to your HTML -->

    <body>
      <num-text></num-text>
    </body>
    ```
    ```javascript
    /*  Append it to the document using JavaScript  */

    var numberedTextarea = document.createElement("num-text");
    document.body.appendChild(numberedTextarea);
    ```

3. Ready for action!

### Styling a Num-Text Element
Changing the default styles of a `<num-text>` element is really simple! Follow the steps written below to see how you can style each and every pixel just the way you want it:

```html
<!-- Element structure -->

<num-text>
  #shadow-root (open)

    <link rel="stylesheet" href="https://offroaders123.github.io/Num-Text-Component/styles.css">
    <container>

      <gutter>
        <line-number>
          ::before (Visible line number and spacing)
        </line-number>
      </gutter>

      <editor></editor>

    </container>

</num-text>

```

*More coming soon!*