# PlanarAlly Mods

This repository is meant as a collection of example interactions with the PlanarAlly mod API.

These are organised in the `packages/` subdirectory and a short summary of each package follows below.

They are generally meant to be used for educational purposes rather than being actual useful mods.

For more information on PA mods, you can check out the rough explanation in https://github.com/Kruptein/PlanarAlly/pull/1297.

## Building

This repository uses `pnpm`.

To build all the mods:

```zsh
pnpm install
pnpm -r build-api
pnpm -r build
```

Each package (except api) will output their mod artifact in its `dist/` folder.

## Packages/Mods

### Obfuscated Trackers

This is a mod that explores interacting with `DataBlocks`, `Trackers` and adding a UI element to the `Tracker Settings`.

It hides the real value of a tracker to other players and shows a rougher approximation instead.

### Simple Char Sheet

This mod explores interaction with `DataBlocks`, `Characters` and `Shape Settings`.

It is meant as a very system-agnostic and simple character sheet.
It looks ugly, but that's fine. It's main purpose is to track data.

_It should eventually also show interaction with the dice API when that gets implemented in the main codebase as well as showing quick-actions for characters, which also does not yet exist._

### api

_The fate of this package is still a bit undecided. A proper official api package doesn't exist yet as the mod api is still in very early stages._

This package contains a bunch of types that the other packages rely on.
Do note that this is not a full collection of all types/interfaces that the PA API actually exposes,
but rather a collection of types that the other mods use.
