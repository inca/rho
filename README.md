# Rho semantic markup language for Node

Rho is easy-to-{read,write,understand} semantic plain text markup language for Node.

Rho *is not Markdown*, although it takes a lot of ideas from modern
plain-text-to-html conversion tools.

Compared to Markdown, Rho features:

  * precise structuring of complex blocks (code blocks within lists, sublists, etc.);

  * powerful selectors mechanism which allows decorating blocks with
    the most anticipated `id` and `class` attributes;

  * more strict rules -- there is only one way of doing each feature;

  * API-level extensibility by providing `resolveLink(id)` and `resolveImage(id)`
    which can use data sources for resolving `[reference-style links][id]` and
    `![reference-style images][id]`.

## Installing

```
npm install -g rho
```

Depending on your environment you may require super-user privileges to install
Rho globally. If this is your case, prepend the above command with `sudo`.

## Usage

To use Rho with your Node application simply require it:

```
var rho = require("rho");
```

### Synchronous rendering

If you have small texts (< 50K) you should be OK with synchronous rendering:

```
var html = rho.toHtml(sourceText);
```

### Asynchronous rendering

With large documents in concurrent environment (e.g. in a web application)
it might be a good idea to stick with asynchronous rendering:

```
rho.render(sourceText, function(err, html) {
  // `html` contains the resulting markup
});
```

In asynchronous mode each block-level element is emitted at every tick.

### Inline rendering

You can also render only inline-level markup:

```
rho.toInlineHtml(sourceText);
```

In inline mode all block-level elements (paragraphs, headings, lists, etc.)
are not recognized. Inline mode is always synchronous.

### Command-line interface

To make things sweet, Rho comes bundled with command-line tool:

```
rho -i source.txt -o output.html --stats --pretty
```

Please browse though `rho --help` for quick usage tips or
refer to `man rho` for complete walkthrough.

## Things to come

[ ] common typographic enhancements

[ ] support for macros

## License

Copyright (C) 2013 Boris Okunskiy <boris@okunskiy.name> (MIT license)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.