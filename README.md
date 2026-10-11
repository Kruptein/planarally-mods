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

## Developing against a local server

PlanarAlly can serve an unpacked mod and reload connected clients when its files change. In the server config (`server/data/config.toml`):

```toml
[mods]
dev_directories = ["../../planarally-mods/packages"]
```

Paths are relative to the `server/` directory. A folder counts as a mod when it contains `mod.toml` and either `index.js` or `dist/index.js`. Pointing `dev_directories` at `packages/` picks up every example mod.

Both build as serve mode are supported in this setup.

For regular builds you can just use the build or watch commands and have the production build of the mod automatically reloaded.

There are some technical downsides to this that may or may not bother you during development.
For most UI components for example, you'll have to close the component and re-open it to see the proper new version.

This is where the serve / dev / hmr mode comes into play, using a vite dev server which can be started using the `pnpm dev` command.

Each package listens on a fixed port (5273–5277) and writes `vite-dev.json` next to its `mod.toml` while that server is running. PlanarAlly loads `origin + entry` from that file, and Vue updates an open mod in place. Stop `pnpm dev` and the file is removed.

Restart the PlanarAlly server after changing `dev_directories`. File changes after that are picked up on their own. The DM mod settings also have a "Reload dev mods" button.

## Packages/Mods

### 1. Mostly educational

These mods are not really expected to be used as is, though they can be.
Instead they are here to show some examples of what you could do with mods.
These will be heavily commented to explain why certain decissions are made.

#### Simple Char Sheet

This mod explores interaction with `DataBlocks`, `Characters` and `Shape Settings`.

It is meant as a very system-agnostic and simple character sheet.
It looks ugly, but that's fine. It's main purpose is to track data and be an educational tool.

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
