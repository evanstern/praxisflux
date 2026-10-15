// demo.mjs — a minimal port contract used only to prove the chassis (spec 073 R1/R4). Not
// shipped under lib/; this fixture is not a real port.
import { definePort } from "../../../../../lib/port-registry.mjs";

export default definePort({
  name: "demo",
  methods: ["get", "set"],
  floors: ["memory"],
});
