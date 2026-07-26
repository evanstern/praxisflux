# 009-p3-phase-status-gates — plan

1. Read docs/principles.md (P1/P2 structure + provenance conventions post-TASK-33);
   spec-bridge/gates/* (derivation stages, checkBridge, loadBridgeConfig/strictDone),
   the spec-bridge tests (lifecycle stages, verdict ranking, strictDone), and
   docs/consuming-gates.md + spec-bridge/README.md.
2. R1: author P3 canonically.
3. R2: statusVocabulary opt-in in .spec-bridge.json; derivation maps stages → consumer
   status names; absent config = today's behavior bit-for-bit.
4. R3: checkBridge ranks at phase grain under the opt-in; block/warn/silent semantics
   preserved.
5. R4: consumer docs, one story.
6. R6: tests (additive), versions (spec-bridge + marketplace 0.18.0), wiki re-pins,
   CAPSULES regen if needed.
7. Orchestrator: R5 cross-ref note at finalization; PR; serial merge vs TASK-43.
