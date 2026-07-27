# 003-version-flag — plan

1. In `bin/pet.mjs`, handle `--version`/`version` before verb dispatch: read
   `package.json` relative to the script (`new URL("../package.json", import.meta.url)`),
   print `praxis-pet <version>`, exit 0.
2. No new files, no state-machine change — this is the one-file live-demo task.
3. Wiki: `pet-cli` note re-verified and re-pinned after merge.
