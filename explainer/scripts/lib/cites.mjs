// x-cite numbering and the generated Sources page (build steps 3;
// ). Citation numbers are first-use order *across the whole artifact*
// — in practice
// that means "in contents.json pages[] order, then document order within
// each page", which lib/build.mjs provides by expanding pages strictly in
// pages[] order against one shared registry (this module doesn't know about
// page order itself).
//
// x-cite expansion itself (building the <a class="ex-cite"> element) lives
// in lib/includes.mjs, which is where file:line error context is available;
// this module only owns the registry and the Sources page renderer.

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Builds the GitHub blob URL for a `kind: "file"` source or an `x-file`
 * element (/ : "File sources link to
 * https://github.com/<repo.github>/blob/<repo.ref>/<path>#L<line>").
 * `line` is optional; an empty string, null or undefined all mean "no line".
 */
export function githubBlobUrl(repo, filePath, line) {
  const base = `https://github.com/${repo.github}/blob/${repo.ref}/${filePath}`;
  return line === undefined || line === null || line === "" ? base : `${base}#L${line}`;
}

/**
 * A `kind: "diff"` source never gets an external blob URL (there's no
 * single file/line it points at) and must never reach `ref.github`
 * (scripts/lib/check.mjs's `collectGithubTargets` only looks at
 * `class="ex-path"` hrefs built from `githubBlobUrl`, so simply never
 * calling that function here is enough). Its inline `<a class="ex-cite">`
 * marker instead anchors to its own Sources-page list item.
 *
 * In a single-shape build every page lives in the one built file, so a
 * bare `#sources--<n>` fragment already resolves. In a --multi build each
 * page is its own file (lib/shell.mjs's single/multi shell emission) —
 * `#sources--<n>` alone would point at *whatever page the cite itself is
 * on*, where that id does not exist (a dead link in the browser; it only
 * looks fine to `ref.anchor`, scripts/lib/check.mjs, because that check
 * collects ids across every built file, not per file). So in multi shape
 * the href is qualified with the generated Sources page's own filename —
 * `<sourcesPageId>.html#sources--<n>` — the same precedent lib/shell.mjs's
 * `buildTermsData`/`termsPageId` already use for a term's `see` link
 * (`${termsId}.html#terms--${see}`), and the same shape every other
 * cross-page link in this build already carries (lib/includes.mjs's
 * handlePage, handleInfoTrigger's `see=`).
 */
function hrefFor(source, number, repo, { multi, sourcesPageId } = {}) {
  if (source.kind === "url") return source.url;
  if (source.kind === "diff") {
    return multi && sourcesPageId ? `${sourcesPageId}.html#sources--${number}` : `#sources--${number}`;
  }
  return githubBlobUrl(repo, source.path, source.line);
}

/**
 * One registry per build, shared by every page's expansion pass. `cite()`
 * assigns a source its number on first use and reuses it on every later
 * citation of the same source id, anywhere in the artifact. `opts`
 * (`{ multi, sourcesPageId }`) is only consulted for a `kind: "diff"`
 * source's href — see `hrefFor` — and is optional for every other kind
 * (and for every existing caller/test that predates it).
 */
export function createCiteRegistry() {
  const numbers = new Map(); // sourceId -> number
  const order = []; // source objects, in first-use (= numbering) order

  function cite(sourceId, source, repo, opts) {
    let number = numbers.get(sourceId);
    if (number === undefined) {
      number = order.length + 1;
      numbers.set(sourceId, number);
      order.push(source);
    }
    const href = hrefFor(source, number, repo, opts);
    return { number, href };
  }

  function usedSources() {
    return [...order];
  }

  return { cite, usedSources };
}

/**
 * Renders one `kind: "diff"` source's Sources-page entry: plain text —
 * never a link — for the range itself (so `ref.github`'s `collectGithubTargets`
 * never sees it, since that scan only looks at `class="ex-path"` hrefs), and
 * each of its `files[]` rendered exactly like a `file` source with no line
 * (a real `class="ex-path"` link, so `ref.github` *does* check those).
 */
function renderDiffItem(source, n, repo) {
  const filesHtml = (source.files || [])
    .map((f) => {
      const href = githubBlobUrl(repo, f);
      // `.ex-vh`: same new-tab cue span as every other target="_blank"
      // link this plugin emits (lib/includes.mjs's handleCite/handleFile).
      return `<li><a class="ex-path" target="_blank" rel="noopener" href="${escapeAttr(href)}">${escapeText(f)}<span class="ex-vh"> (opens in new tab)</span></a></li>`;
    })
    .join("");
  const filesBlock = filesHtml ? `<ul>${filesHtml}</ul>` : "";
  return `<li id="sources--${n}" value="${n}">Diff <code>${escapeText(source.range)}</code>${filesBlock}</li>`;
}

/**
 * Renders the generated Sources page: every source actually cited via
 * x-cite somewhere in the artifact, in first-use (= numbering) order. A
 * source declared in contents.json but never cited is not listed — it has
 * no number to list it under.
 */
export function renderSourcesPage(usedSources, repo) {
  if (usedSources.length === 0) {
    return `<p class="ex-sources-empty">No sources were cited.</p>`;
  }
  const items = usedSources
    .map((source, i) => {
      const n = i + 1;
      if (source.kind === "diff") return renderDiffItem(source, n, repo);
      const href = source.kind === "url" ? source.url : githubBlobUrl(repo, source.path, source.line);
      const label = source.kind === "url" ? source.url : source.path;
      const vendor = source.vendor ? ` <span class="ex-vendor">(vendor)</span>` : "";
      // `.ex-vh`: same new-tab cue span as every other target="_blank"
      // link this plugin emits (lib/includes.mjs's handleCite/handleFile).
      return (
        `<li id="sources--${n}" value="${n}">` +
        `<a class="ex-path" target="_blank" rel="noopener" href="${escapeAttr(href)}">${escapeText(label)}<span class="ex-vh"> (opens in new tab)</span></a>` +
        `${vendor}</li>`
      );
    })
    .join("");
  return `<ol class="ex-sources">${items}</ol>`;
}
