# praxis-pet

A tiny tamagotchi-style virtual pet that lives in your terminal. This is the
**praxisflux PDLC demo app** — a deliberately small, real Node project whose git
history demonstrates the praxis development lifecycle stage by stage.

## Use

```sh
node bin/pet.mjs new Mochi   # adopt a pet
node bin/pet.mjs status      # how are they doing?
node bin/pet.mjs feed        # hunger down, happiness up
node bin/pet.mjs play        # happiness up, energy down
node bin/pet.mjs rest        # energy up
node bin/pet.mjs tick        # time passes; neglect is eventually fatal
```

State is a JSON file (`.pet.json`, override with `PET_STORE`).

## Test

```sh
node --test
```
