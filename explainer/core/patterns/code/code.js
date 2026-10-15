"use strict";
/* core/patterns/code — tokenizer highlighter for .ex-code-pre code blocks
   (ts, js, json, yaml, py, sh, dockerfile, md, tree). Pure, dependency-free
   regex tokenizer: one alternation regex per language, classify by which
   capture group matched, extended with js/py/sh/punctuation handling.
   Exposes a small API (`tokenize`/`highlightAll`) so the
   tokenizer is unit-testable from Node (scripts/test/patterns.test.mjs,
   via node:vm — no DOM needed to call `tokenize`); `highlightAll()` itself
   only touches the DOM when one exists, and is idempotent — re-running it
   skips any `<code>` already marked `data-ex-code-done`, and does nothing
   at all on a page with no `.ex-code-pre code` element.

   `highlightAll()` used to read `codeEl.textContent` and replace the whole
   subtree with `innerHTML = <rebuilt string>` — a hand-authored
   `<span data-info="key">` marker inside a code block (a clickable value
   inside a JSON envelope being annotated, for example) was flattened to
   plain text and permanently lost the moment this ran. Fixed by walking
   real child *nodes* instead of
   a flattened string: a text node is replaced with its own tokenized
   fragment (one or more text/span nodes, built with createElement/
   createTextNode — real DOM, no HTML-escaping needed since nothing is ever
   parsed back out of a string), while an existing child element is left in
   place — same object, same attributes, same (not-yet-wired) listeners —
   only recursing into *its* own children to tokenize whatever text lives
   inside it too. */
(function (root) {
  var KEYWORDS = {
    ts: "export|import|from|const|let|var|async|await|function|return|if|else|while|for|of|in|switch|case|break|continue|interface|type|class|extends|implements|new|true|false|null|undefined|this|super|typeof|instanceof|void|throw|try|catch|finally|yield|static|public|private|protected|readonly|enum|namespace|declare|as|satisfies",
    js: "export|import|from|const|let|var|async|await|function|return|if|else|while|for|of|in|switch|case|break|continue|class|extends|new|true|false|null|undefined|this|super|typeof|instanceof|void|throw|try|catch|finally|yield|static",
    py: "def|class|import|from|return|if|elif|else|while|for|in|is|not|and|or|try|except|finally|with|as|pass|break|continue|lambda|yield|True|False|None|self|global|nonlocal|raise|assert|del|async|await",
    sh: "if|then|elif|else|fi|for|while|do|done|case|esac|function|in|return|exit|local|export|readonly|set|shift",
    dockerfile: "FROM|RUN|COPY|ADD|ENV|ENTRYPOINT|WORKDIR|ARG|CMD|EXPOSE|VOLUME|USER|LABEL|SHELL|ONBUILD|STOPSIGNAL|HEALTHCHECK",
    yaml: "true|false|null|yes|no|on|off",
    json: "true|false|null",
    md: "",
    tree: "",
  };

  var HASH_COMMENT_LANGS = { yaml: true, py: true, sh: true, dockerfile: true };
  var KEY_LANGS = { yaml: true, md: true };
  var FUNCTION_CALL_LANGS = { ts: true, js: true, py: true };
  var PUNCT_RE_SRC = "[{}()\\[\\]<>:;,.=+\\-*/%!&|^~?]+";

  // `tree` has no grammar to speak of: every line is "path" + an optional
  // 2-or-more-space-separated trailing note (matching the generator's own
  // `tree`-style output) — split on that shape instead of tokenizing.
  function tokenizeTreeLine(line) {
    var m = /^(\s*\S.*?)(\s{2,}\S.*)$/.exec(line);
    if (!m) return [{ cls: "", text: line }];
    return [
      { cls: "", text: m[1] },
      { cls: "ex-tok-desc", text: m[2] },
    ];
  }

  /**
   * Tokenizes `src` for `lang` into a flat array of `{ cls, text }` parts
   * (`cls === ""` is plain, unstyled text). Pure — no DOM access, safe to
   * call directly in a test. An unrecognized `lang` still gets comment/
   * string/number/punctuation handling (the generic C-style comment and
   * plain string/number/punctuation rules); only the keyword and
   * yaml/md-key rules are truly per-language.
   */
  function tokenize(src, lang) {
    if (lang === "tree") {
      var out = [];
      var lines = src.split("\n");
      lines.forEach(function (line, i) {
        out.push.apply(out, tokenizeTreeLine(line));
        if (i < lines.length - 1) out.push({ cls: "", text: "\n" });
      });
      return out;
    }

    var commentPart =
      lang === "md"
        ? "(<!--[\\s\\S]*?-->)"
        : lang === "json"
          ? "(\\u0000never)"
          : HASH_COMMENT_LANGS[lang]
            ? "((?:^|\\s)#.*$)"
            : "(\\/\\/.*$|\\/\\*[\\s\\S]*?\\*\\/)";
    var stringPart = '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)';
    var kw = KEYWORDS[lang];
    var keywordPart = kw ? "\\b(" + kw + ")\\b" : "(\\u0000never)";
    var numberPart = "\\b(\\d+(?:\\.\\d+)*)\\b";
    var keyPart = KEY_LANGS[lang] ? "(^\\s*-?\\s*[\\w.$-]+(?=:\\s|:$))" : "(\\u0000never)";
    var functionPart = FUNCTION_CALL_LANGS[lang] ? "\\b([a-zA-Z_]\\w*)(?=\\()" : "(\\u0000never)";
    var punctPart = "(" + PUNCT_RE_SRC + ")";

    var re = new RegExp(
      [commentPart, stringPart, keywordPart, numberPart, keyPart, functionPart, punctPart].join("|"),
      "gm"
    );

    var out = [];
    var last = 0;
    var m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(src))) {
      if (m[0] === "") {
        re.lastIndex += 1;
        continue;
      }
      if (m.index > last) out.push({ cls: "", text: src.slice(last, m.index) });
      if (m[1] !== undefined) out.push({ cls: "ex-tok-com", text: m[1] });
      else if (m[2] !== undefined) out.push({ cls: "ex-tok-str", text: m[2] });
      else if (m[3] !== undefined) out.push({ cls: "ex-tok-kw", text: m[3] });
      else if (m[4] !== undefined) out.push({ cls: "ex-tok-num", text: m[4] });
      else if (m[5] !== undefined) out.push({ cls: "ex-tok-key", text: m[5] });
      else if (m[6] !== undefined) out.push({ cls: "ex-tok-fn", text: m[6] });
      else if (m[7] !== undefined) out.push({ cls: "ex-tok-punct", text: m[7] });
      last = re.lastIndex;
    }
    if (last < src.length) out.push({ cls: "", text: src.slice(last) });
    return out;
  }

  function langOf(codeEl) {
    var m = /\bex-code-lang-([\w-]+)\b/.exec(codeEl.className || "");
    return m ? m[1] : "text";
  }

  /**
   * Builds the real DOM replacement nodes for one text node's worth of
   * source (`lang === "text"`: no highlighting, just the text itself —
   * same effective output as the old `esc(src)` string path, but as a
   * single real text node instead of an HTML-escaped string, since there is
   * no innerHTML write left to need the escaping for).
   */
  function makeTokenNodes(doc, text, lang) {
    if (lang === "text") return [doc.createTextNode(text)];
    return tokenize(text, lang).map(function (p) {
      if (!p.cls) return doc.createTextNode(p.text);
      var span = doc.createElement("span");
      span.className = p.cls;
      span.appendChild(doc.createTextNode(p.text));
      return span;
    });
  }

  /**
   * Walks `parent`'s existing child *nodes* (not its flattened textContent):
   * a text node is replaced in place by its own tokenized fragment; an
   * element child (a hand-authored `<span data-info="key">`/`<a>`/etc.
   * marker, or anything else an author nested inside the code) is left
   * untouched as the same node — only its own children are recursed into,
   * so text *inside* the marker still gets tokenized too.
   */
  function tokenizeChildNodes(doc, parent, lang) {
    var kids = Array.prototype.slice.call(parent.childNodes);
    for (var i = 0; i < kids.length; i += 1) {
      var node = kids[i];
      if (node.nodeType === 3) {
        var replacement = makeTokenNodes(doc, node.data, lang);
        for (var j = 0; j < replacement.length; j += 1) parent.insertBefore(replacement[j], node);
        parent.removeChild(node);
      } else if (node.nodeType === 1) {
        tokenizeChildNodes(doc, node, lang);
      }
    }
  }

  /**
   * Highlights every not-yet-processed `.ex-code-pre code` under `scope`
   * (default `document`). No-op when `scope` has no such element, or no
   * `document` exists at all (so requiring this file in Node, before any
   * DOM is attached, never throws).
   */
  function highlightAll(scope) {
    var root2 = scope || (typeof document !== "undefined" ? document : null);
    if (!root2 || !root2.querySelectorAll) return;
    var doc = typeof document !== "undefined" ? document : root2.ownerDocument || root2;
    var codes = root2.querySelectorAll(".ex-code-pre code:not([data-ex-code-done])");
    for (var i = 0; i < codes.length; i += 1) {
      var el = codes[i];
      var lang = langOf(el);
      tokenizeChildNodes(doc, el, lang);
      el.setAttribute("data-ex-code-done", "");
    }
  }

  var api = { tokenize: tokenize, highlightAll: highlightAll };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ExplainerCode = api;

  if (typeof document !== "undefined") highlightAll();
})(typeof globalThis !== "undefined" ? globalThis : this);
