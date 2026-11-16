# SRD 5.1

## Legal

This mod is compatible with fifth edition. It provides System Reference Document 5.1 material for PlanarAlly.

The required attribution is in [LICENSE.md](LICENSE.md).

## What it does

The mod adds a variety of info to the compendium:

- abilities
- backgrounds
- classes
- conditions
- items
- languages
- races
- skills
- spells

It also adds a typed model for a character stored in DataBlocks and CustomData to offer a consistent schema for inter-mod communication.
The data stored in CustomData, is data that is useful to use in dice rolls (e.g. skills / saves ...), whereas the data stored in DataBlocks is more cumbersome to store in custom data (e.g. spells, attacks, text descriptions etc.).

Another mod can thus use this data to offer extra things (e.g. a character sheet, an alternate initiative UI, ...).
By using the schemas defined in this mod, another mod can also add extra compendium entries, which will then be available in other mods as well (a character sheet mod could show a homebrew class from another mod)

See [USAGE.md](USAGE.md) for how to use characters and add content from another mod.

This is NOT a good example mod to learn how to write PlanarAlly mods, as this is written explciitly in a way to make interoperability with other mods possible and also contains a lot of automation for various aspects of the 5e character system.
