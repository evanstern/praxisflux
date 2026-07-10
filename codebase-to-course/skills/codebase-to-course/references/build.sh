#!/bin/bash
# codebase-to-course chrome v2 — inline translation engine (comments-on-top)
# Assembles the course from parts.
# Run from the course directory: bash build.sh
set -e
if command -v node >/dev/null 2>&1 && [ -f validate.mjs ]; then
  node validate.mjs modules/*.html
else
  echo "warn: node or validate.mjs missing — skipping translation-block validation" >&2
fi
cat _base.html modules/*.html _footer.html > index.html
echo "Built index.html — open it in your browser."
