// dates.mjs — ISO date helpers shared across the suite.

/** Today's date (or `date`'s) as an ISO `YYYY-MM-DD` string. */
export function today(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Rewrite an `updated:` frontmatter line to today's date. No-op if none present. */
export function bumpUpdated(text, date = new Date()) {
  return (text || "").replace(/^(updated:\s*).*$/m, `$1${today(date)}`);
}
