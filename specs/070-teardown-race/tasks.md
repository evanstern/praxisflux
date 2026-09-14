# Spec 070 — tasks

**Task:** TASK-0123 · Phases are internal breakdown; they ride this one branch and merge in
this task's single PR.

## Phase 1 — confirm the mechanism

- [x] What holds the `.git` handle is established from evidence — observed, not inferred
- [x] If the specific holder cannot be observed on this platform, that is stated plainly
      along with what WAS established; the hypothesis is never asserted as confirmed fact
- [x] `force: true`'s actual semantics recorded (suppresses missing paths, not ENOTEMPTY)
      so the "we already force" objection is answered in the artifact

## Phase 2 — the shared teardown helper

- [x] A shared test-support helper removes a fixture dir with bounded retry-and-backoff
- [x] It retries on ENOTEMPTY / EBUSY / EPERM and re-throws after its bound — loud, never silent
- [x] The retry policy and its reason are documented at the helper, in the suite's comment style
- [x] All seven teardown sites in `test/stop-docs-window.test.mjs` use it
- [x] The fix is named in the artifact as retry-with-backoff (R2's "state which kind it is")

## Phase 3 — prove it

- [x] N consecutive runs of the target suite green, with N and the RAW counts recorded from
      real output (TASK-114's standard: 20/20, read from the log, not a summary)
- [x] Negative control: the four stop-docs window behaviours are shown to FAIL when the
      window logic regresses, and the control is shown to have actually broken the thing
- [x] The report states plainly that N green runs bound but do not prove absence of a rare race
- [x] Full suite green: `node --test`, raw counts recorded

## Phase 4 — sibling audit and close

- [x] Each of the sixteen sibling files using git-init-in-mkdtemp is audited; per file, either
      it adopts the helper or its clearing is recorded with the reason
- [x] Any sibling needing more than the shared helper is REPORTED as a finding, not silently
      absorbed into this task
- [x] Freshness probe run; any note pinning a touched file re-pinned honestly (RE-PIN-ONLY vs
      NEEDS-REVIEW classified against the real diff)
- [x] Version-bump status verified against `check-version-bump.mjs --base origin/main` — test-only
      change, no bump expected; verified rather than assumed
