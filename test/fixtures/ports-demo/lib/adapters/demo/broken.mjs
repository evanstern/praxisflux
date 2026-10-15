// broken.mjs — a demo-port adapter missing its `set` method (spec 073 R1 negative case):
// registers fine (discovery never validates), fails `registry.resolve`. `detect` always
// returns false so it is never auto-selected by the configurator.
export default function brokenDemoAdapter() {
  return {
    name: "broken",
    capabilities: ["memory"],
    detect() {
      return false;
    },
    probe() {
      return { ok: false, reason: "demo broken adapter is never runnable" };
    },
    get() {
      return null;
    },
    // `set` intentionally missing.
  };
}
