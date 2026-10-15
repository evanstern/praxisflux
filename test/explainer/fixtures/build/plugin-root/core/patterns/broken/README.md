# broken pattern fixture

Deliberately missing `broken.css` — the lookup finds this folder (so it is
not "absent"), but the required stylesheet is missing, which is a malformed
pattern (build error), not a silently-skipped unresolved name.
