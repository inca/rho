# Rho API

Rho uses compilers to process source text and to render HTML markup.

There are three kinds of compilers:

  * [InlineCompiler](https://github.com/inca/rho/blob/master/lib/inline.js)
  * [BlockCompiler](https://github.com/inca/rho/blob/master/lib/block.js)
  * [AsyncCompiler](https://github.com/inca/rho/blob/master/lib/async.js)

Compilers depend on each other: async compiler uses block compiler to
process individual block-level elements, while block compiler uses
inline compiler to emit inline-level elements.

Each compiler takes the `options` object for configuration. It is merged with
[default configuration](https://github.com/inca/rho/blob/master/lib/defaults.js)
and then passed to the compiler instance it depends upon (e.g. block compiler
will pass its options to the inline compiler it creates).

**Important note:** `BlockCompiler` and `InlineCompiler` are synchronous -- they will
block until the document is fully rendered. An important consequence is that
they are **not** designed for concurrency: one instance can be used to process
one job at a time (although it can be used again once the job is finished).
On the contrary, `AsyncCompiler` is designed to be asynchronous, so a single
instance can be used to process an arbitrary amount of documents concurrently.

## Simple usage

Please refer to [README](https://github.com/inca/rho#README).

## Using compilers

Inline and block compilers follow the same usage pattern:

```
var InlineCompiler = require("rho").InlineCompiler;

// Create an instance, pass options:
var compiler = new InlineCompiler({ /* optional configuration */});

// Render input synchronously, return a string:
compiler.toHtml("Hello, *World*!");   // 'Hello, <strong>World</strong>!'

// Compiler instance contains a buffer, where intermediate results reside:
compiler.out  // [ 'Hello, ', '<strong>', 'World', '</strong>', '!' ]

// You can append to current compilation:
compiler.append(" And _everyone_!");

// Finally, you can assembly output buffer into a string:
compiler.outToString();  // 'Hello, <strong>World</strong>! And <em>everyone</em>!'

// Calling `reset` will empty the buffer:
compiler.reset();

// `compiler.toHtml(input)` is equivalent to
// `compiler.reset().append(input).outToString()`
```

Asynchronous compiler is used a bit differently:

```
var AsyncCompiler = require("rho").AsyncCompiler;

// Create an instance, pass options:
var compiler = new AsyncCompiler({ /* optional configuration */});

// Schedule the compilation
compiler.render("Hello world!", function(err, html) {
  // do something with `html`
});
```

As you would expect, the `render` method exits immediately. The callback
will be invoked once the compilation is over.

Asynchronous compiler operates only in block mode (it would be a tremendous waste
of computational resources to emit every single character asynchronously, right?).

## Configuration

### Resource resolution

The configuration `options` are primarily used to extend the vocabulary of
the compiler with reference-style links and images.

This is done by defining following functions:

  * `resolveLink(id)` should return either an URL of the link,
    or the _resource definition_. It is used to convert reference-style links.

  * `resolveImage(id)` should return either an URL of the image,
    or the _resource definition_. It is used to convert reference-style images.

Resource definition must include `url` and optional `title`.

For example, consider following configuration:

```
var links = {
  rho: {
    url: "http://github.com/inca/rho",
    title: "Rho — text2html processing tool for Node"
  },
  node: "http://nodejs.org"
};

var images = {
  gravatar: {
    url: 'http://gravatar.com/avatar/e1e3018a2ed287d8bae27bacdabefcb6',
    title: "Look at me!"
  }
};

var compiler = new InlineCompiler({

  resolveLink: function(id) {
    return links[id];
  },

  resolveImage: function(id) {
    return images[id];
  }

});
```

Now you can use:

  * headless links

    ```
    Everybody likes [[rho]]!
    ```

    ```
    Everybody likes <a href="http://github.com/inca/rho" title="Rho — text2html processing tool for Node">Rho — text2html processing tool for Node</a>!
    ```

  * reference-style links

    ```
    Everybody likes [Rho][rho]!
    ```

    ```
    Everybody likes <a href="http://github.com/inca/rho" title="Rho — text2html processing tool for Node">Rho</a>!
    ```

  * reference-style images

    ```
    ![][gravatar]
    ```

    ```
    <img src="http://gravatar.com/avatar/e1e3018a2ed287d8bae27bacdabefcb6"
         title="Look at me!"/>
    ```

Additionally, resource definitions can contain `html` property, which
completely overrides the output of reference-style image.

### Typographic enhancements

Typographic enhancements can be turned off:

```
var options = {
  typographics: {
    enabled: false
  }
}
```

Additionally, entity references emitted during typographics processing
can be customized:

```
var options = {
  typographics: {
    ldquo: "&laquo",
    rdquo: "&raquo"
  }
}
```

See [default configuration](https://github.com/inca/rho/blob/master/lib/defaults.js)
for the complete list of entity references.

