// fake.mjs — an in-memory adapter for the demo port fixture (spec 073 R1/R4): satisfies the
// full contract, always detects, always runnable. The one real adapter this fixture proves
// the harness and registry against.
export default function fakeDemoAdapter() {
  const store = new Map();
  return {
    name: "fake",
    capabilities: ["memory"],
    detect() {
      return true;
    },
    probe() {
      return { ok: true };
    },
    get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    set(key, value) {
      store.set(key, value);
    },
  };
}
