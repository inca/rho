# Rho Syntax Reference

Rho operates on **source texts** -- an _almost_ plain text document
with special symbols which designate its _semantics_.

The semantics represent the _meaning_ of what you write. Rho operates
on this meaning to produce meaningful HTML markup.

**About the examples.** This documentation is written in
[GFM](https://help.github.com/articles/github-flavored-markdown).
Due to some constraints of this markup language (specifically, not being
able to backslash-escape special chars inside code blocks)
we've cheated a bit: zero-width spaces were used to prevent GFM from parsing
special chars in our examples. Be careful when you copy-paste!

## Basic concepts

Rho sees source text as a sequence of _blocks_. Blocks are delimited by
at least one blank line. Consecutive whitespace characters inside a single
block are condensed into a single space.

Consider three simple blocks:

```
## Section title

First paragraph.

Second
paragraph.

Third paragraph.
```

The output (prettified) will be:

```
<h2>Section title</h2>
<p>First paragraph.</p>
<p>Second paragraph.</p>
<p>Third paragraph.</p>
```

Rho recognizes following kinds of blocks:

 * paragraphs;
 * lists — ordered and unordered;
 * headings;
 * code blocks;
 * divs;
 * horizontal lines;
 * tables;
 * arbitrary block-level HTML elements.

Text inside blocks can contain _inline markup_ -- special bits of syntax
for creating links, emphasizing words, marking the code, etc.

### Selectors

Rho features very powerful feature called _selectors_ which allows
attaching HTML attributes `id` and `class` to any kind of block.

The selector expression must be written on the first line of a block.
It looks pretty much like CSS selectors (hence the name) enclosed in curly braces:

```
This paragraph is special! {#special.emphasized}
```

This example is rendered into the following markup:

```
<p id="special" class="emphasized">This paragraph is special!</p>
```

Selectors allow text authors to define their own set of semantic blocks,
e.g. notes, warnings, sidenotes, kickers, etc.

## Block elements

### Paragraphs

One or more consecutive lines of text are interpreted as a paragraph.
Paragraphs are rendered as HTML `<p>` element.

```
First
paragraph.

Second one.
```

Paragraph is also a _generic_ block in a sense that any block which
does not conform to the semantics of another kinds is considered a paragraph.

Rho does not have a special syntax to emit line breaks `<br/>`,
effectively supporting hard-wrapped text paragraphs. Specifically,
trailing whitespace **is not** interpreted as `<br/>`, because it is
virtually impossible to spot them in the text.

Selector for paragraph can be written either on the first line alongside the text,
or on the separate line before the paragraph body:

```
{#id.class1.class2}
Paragraph with id and some classes.

Paragraph with id {#id.class1.class2}
and some classes.
```

### Code blocks

Rho supports [GFM](https://help.github.com/articles/github-flavored-markdown)-style
code blocks.

```
`​`​`
<a href='javascript:;'>Load more</a>
`​`​`
```

The above text is rendered into the following markup:

```
&lt;a href='javascript:;'&gt;Load more&lt;/a&gt;
```

HTML markup inside code blocks is escaped.

The selector expression should be written on the line with markers:

```
`​`​` {.scala}
def main(args: Array[String]) {
  println("Hello World!")
}
`​`​`
```

### Divs

Rho supports a general-purpose block which is rendered into HTML `<div>`
element. You will find divs extremely useful in combination with selectors --
whenever you wish to group some blocks under a custom class.

```
~​~​~ {.note}
This is a note.

This paragraph is inside a note.
~​~​~
```

Divs combined with CSS classes give you the possibility to create your
own set of semantic elements.

### Lists

Lists start with a _list marker_: an asterisk (`*`) for
unordered lists and a number followed by period (e.g. `1.`)
for ordered lists:

```
* List item 1
* List item 2
* List item 3

1. List item 1
2. List item 2
3. List item 3
```

List markers should be delimited from another text by one or more space
characters.

Lists are _complex blocks_ in a sense that they can contain another nested
blocks inside list items.

Consider the following example:

```
* List item 1

* List item 2

  Still list item 2, just another paragraph

* List item 3
```

The output markup will be like this:

```
<ul>
  <li>List item 1</li>
  <li>
    <p>List item 2</p>
    <p>Still list item 2, just another paragraph</p>
  </li>
  <li>List item 3</li>
</ul>
```

As you can see from the example, any text indented beyond the list marker
is included into the list item.

Each list item must maintain the same indent to correspond to a specific list.

Following example shows nesting blocks within list items:

```
* List item 1

  * Sub-list inside list item 1

    * Sub-sub-list
    * Sub-sub-list
    * Sub-sub-list

  * Sub-list inside list item 1, second sub-item

* List item 2
```

#### Selectors with lists

Selectors can be used to attach `id` and `class` attributes both to the whole
list blocks (`<ol>` or `<ul>`) and individual list items (`<li>`). Just browse
through following examples to get the idea:

```
* List item 1   {.ul}{.li}{.p}

  Para          {.p}

* List item 2   {.li}{.p}

  Para          {.p}
```

```
<ul class="ul">
  <li class="li">
    <p class="p">List item 1</p>
    <p class="p">Para</p>
  </li>
  <li class="li">
    <p class="p">List item 2</p>
    <p class="p">Para</p>
  </li>
</ul>
```

If you need to omit selector expression for top-level elements, just include
empty pair of curly braces for them:

```
* List item 1   {}{}{.p}

  Para          {.p}

* List item 2   {}{.p}

  Para          {.p}
```

```
<ul>
  <li>
    <p class="p">List item 1</p>
    <p class="p">Para</p>
  </li>
  <li>
    <p class="p">List item 2</p>
    <p class="p">Para</p>
  </li>
</ul>
```

### Horizontal lines

A block containing _only_ three minus characters (and optional selector)
is rendered as HTML `<hr>` element:

```
--- {.clear}
```

```
<hr class="clear"/>
```

### Tables

Rho supports [GFM](https://help.github.com/articles/github-flavored-markdown)-style
tables, with a bit of modifications:

1. Table blocks should start with at least three minus characters.

2. All minus characters are stripped from the first and the last line. What's left
   inside is the contents of the table.

    This essentially allows you to create tables in a single line:

    ```
    --- One | Two | Three
    ```

    ```
    <table>
      <tbody>
        <tr>
          <td>One</td>
          <td>Two</td>
          <td>Three</td>
        </tr>
      </tbody>
    </table>
    ```

3. Every line inside becomes a table row. Cells are delimited with pipes `|`.

    ```
    ---------------------
     One  | Two  | Three
     Four | Five | Six
    ---------------------
    ```

    Trailing and leading pipes are ignored:

    ```
    -----------------------
    | One  | Two  | Three |
    | Four | Five | Six   |
    -----------------------
    ```


4. Table head can be added by separating the first row with a separator line:

    ```
    ---------------------
     Col1 | Col2 | Col3
    ---------------------
     One  | Two  | Three
     Four | Five | Six
    ---------------------
    ```

    Or like this:

    ```
    ---------------------
     Col1 | Col2 | Col3
    ------|------|-------
     One  | Two  | Three
     Four | Five | Six
    ---------------------
    ```

    Or even like this (with redundant decorative pipes):

    ```
    -----------------------
    | Col1 | Col2 | Col3  |
    |------|------|-------|
    | One  | Two  | Three |
    | Four | Five | Six   |
    -----------------------
    ```

5. Alignment attributes can be added to head separation line:

    * a colon at the left side designates the left alignment,
    * a colon at the right side designates the right alignment,
    * colons at both sides designate the center alignment.

    ```
    -----------------------
    | Col1 | Col2 | Col3  |
    |:-----|:----:|------:|
    | One  | Two  | Three |
    | Four | Five | Six   |
    -----------------------
    ```

    In this example `Col1` will be aligned to the left, `Col2` -- to the center
    and `Col3` -- to the right.

6. A single `>` character can be added to the end of the first line of minus
   characters, resulting in addition of `width="100%"` attribute to the table.

    ```
    -------------------->
     Col1 | Col2 | Col3
    ---------------------
     One  | Two  | Three
     Four | Five | Six
    ---------------------
    ```

7. Selectors can be applied to the `<table>` element by placing the selector
   expression at the end of the first line (like with any other blocks).

    ```
    ---------------------      {.rows.cols.striped}
     Col1 | Col2 | Col3
    ---------------------
     One  | Two  | Three
     Four | Five | Six
    ---------------------
    ```

### HTML

When the block starts with an opening block-level HTML tag, Rho searches
recursively for the matching closing tag, emitting the markup without
much processing.

Rho recognizes following HTML tags as block-level:

`address`, `article`, `aside`, `blockquote`, `canvas`,
`dd`, `div`, `dl`, `dt`, `fieldset`, `figcaption`, `figure`, `footer`,
`form`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `header`, `hgroup`, `hr`,
`noscript`, `ol`, `output`, `p`, `pre`, `section`, `table`, `ul`,
`style`, `script`

## Inline markup

As said above, text inside the blocks is processed with inline compiler.

Inline compiler operates in following modes: `normal`, `code` and `plain`.

### Normal mode

In normal mode text is emitted to the output buffer with following
processing features.

  * _Backslash escaping_ causes following chars: ``\.+*[]()`{}_!-|~'"``
    to loose their special meaning as markup elements when they occur
    immediately after backslash `\`.

  * _Ampersand escaping_: ampersand characters `&` have special meaning in SGML
    documents and are escaped as `&amp;` as long as they are not a part of
    an SGML entity reference themselves.

  * _HTML tags_: when inline HTML tags (like `<a>`, `<span>`, etc.) are
    encountered, they are emitted using `plain` mode.

  * _HTML escaping_: the `<` and `>` chars, which have a special meaning in
    HTML documents, are escaped as `&lt;` and `&gt;` respectively (as long
    as they are not a part of the previous rule).

  * At this point various markup elements are recognized:

    * _triple code spans_ are surrounded with three backticks ```` ``` ````,
      their contents is emitted using `plain` mode;

    * _code spans_ are surrounded by a single backtick `` ` ``,
      their contents is emitted using `code` mode;

    * _MathJAX-compatible formulas_ are LaTeX text surrounded with double
      `%%` or `$$` characters, they contents is HTML-escaped and emitted
      with corresponding markers (so that they can be processed with
      [MathJax](http://mathjax.com)).

    * _emphasized text_ is surrounded with single underscore characters `_`
      and is emitted as HTML `<em>` element with its contents processed
      in `normal` mode;

    * _strong emphasize_ is surrounded with single asterisk characters `*`
      and are emitted as HTML `<strong>` element with its contents
      processed in `normal` mode;

    * _inline links_ like `[Link text](http://myurl.com)` are rendered
      as HTML `<a>` element; link text is processed in `normal` mode;

    * _reference links_ like `[Link text][id]` are resolved using
      the `resolveLink(id)` function defined in `options` and are emitted like
      inline links above;

    * _headless reference links_ `[[id]]` are pretty much like reference links,
      but the link text is resolved from the `title` property of the returned
      link definition;

    * _inline images_ like `![Alt text](http://myurl.com/myimg.png)`
      are rendered as HTML `<img>` element;

    * _reference images_ like `![Alt text][id]` are resolved using
      the `resolveImage(id)` function defined in `options` and are emitted
      like inline images above.

  * Additionally, following typographic enhancements are applied:

    ```
    --           ->      &mdash;
    (c), (C)     ->      &copy;
    (r), (R)     ->      &reg;
    (tm), (TM)   ->      &trade;
    ->           ->      &rarr;
    <-           ->      &larr;
    "            ->      &ldquo; or &rdquo;
    '            ->      &lsquo; or &rsquo;
    ```

### Code mode

Regular code spans and code blocks are emitted by applying following processing
features:

  * backslash escaping;
  * ampersand escaping;
  * HTML escaping.

### Plain mode

In plain mode characters are emitted as-is, no escaping occurs.

