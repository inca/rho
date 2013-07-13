# Rho Syntax Reference

Rho operates on **source texts** -- an _almost_ plain text document
with special symbols which designate its _semantics_.

The semantics represent the _meaning_ of what you write. Rho operates
on this meaning to produce meaningful HTML markup.

## Blocks

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
~~~ {.note}
This is a note.

This paragraph is inside a note.
~~~
```

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

