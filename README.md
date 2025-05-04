# PlanarAlly Mods

This repository is meant as a collection of example interactions with the PlanarAlly mod API.

These are organised in the `packages/` subdirectory and a short summary of each package follows below.

Information on the mod API is still very barebones. They were initially announced in https://github.com/Kruptein/PlanarAlly/pull/1297,
which contains a rough overview of some of the important concepts (e.g. datablocks).
A second PR later refined some of the APIs and usability in https://github.com/Kruptein/PlanarAlly/pull/1583.

The goal is to have some proper docs on the main doc website eventually, but for now these examples are the prime source of information.

## Building

This repository uses `pnpm`.

To build all the mods:

```zsh
pnpm install
pnpm -r build-api
pnpm -r build
```

To build a specific mod you can pass the `-F` or `--filter` flag with the package name (as it is in the package.json)

```zsh
pnpm -F '@planarally/system-wildsea' -r build`
```

Each package (except api) will output their mod artifact in its `dist/` folder.

In order to actually import this in PA, you'll have to zip the contents of the dist folder together with the mod.toml from the package's root folder.
This can be done automatically by using the special `zip` command in the root repository.

```zsh
# e.g. to zip the wildsea package
pnpm zip wildsea
```

This will output a `.pam` file in the package's `dist-zip` folder, that can be imported in PA.

Note that this does **not** build the package.

## Packages/Mods

### 1. Mostly educational

These mods are not really expected to be used as is, though they can be.
Instead they are here to show some examples of what you could do with mods.
These will be heavily commented to explain why certain decissions are made.

#### Simple Char Sheet

This mod explores interaction with `DataBlocks`, `Characters` and `Shape Settings`.

It is meant as a very system-agnostic and simple character sheet.
It looks ugly, but that's fine. It's main purpose is to track data.

_It should eventually also show interaction with the dice API when that gets implemented in the main codebase as well as showing quick-actions for characters, which also does not yet exist._

#### Obfuscated Trackers

This is a mod that explores interacting with `DataBlocks`, `Trackers` and `Shape Settings`.

This allows the owner of a shape to hide the real tracker value to other users and instead show them an approximation. (e.g. remove a quarter from the HP if they lost > 1/4th hp)
The real value is stored in a datablock and everytime the tracker is updated, our mod first gets to change the final value sent to the server allowing us to obfuscate the real value.

### 2. Official PlanarAlly mods

These are mods that actually are intended to be used! They may still be in an uncomplete state however :)

Note that official here means they are made by _me_, being the author of PlanarAlly.
They are **NOT** an official product of the (potentially) related company.

### Wildsea

This mod aims to provide basic support for the Wildsea RPG system (See the [MythWorks website](https://www.myth.works/collections/the-wildsea-homepage) for more info about the Wildsea).

It currently adds a ship character sheet mimicking the layout of the official sheet.

### 3. API

_The fate of this package is still a bit undecided. A proper official api package doesn't exist yet as the mod api is still in very early stages._

This package contains a bunch of types that the other packages rely on.
Do note that this is not a full collection of all types/interfaces that the PA API actually exposes,
but rather a collection of types that the other mods currently use.
