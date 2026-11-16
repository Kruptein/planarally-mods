# Using the SRD 5.1 mod from another mod

The SRD mod owns the `dnd-5e` system. Other mods can build on it in two ways:

- **Use characters**: read and change a character through the character service, e.g. for a character sheet, an
  initiative tracker or a party overview.
- **Add content**: register compendium entries with the `dnd-5e` schema, e.g. a homebrew class or spell. The
  character service picks them up like the SRD's own entries, so they show up in every mod that uses it.

Players need the SRD mod enabled alongside yours.

## Setup

Add this package as a dev dependency, for its types:

```json
"devDependencies": {
    "@planarally/system-dnd-5e-srd": "workspace:*"
}
```

The package only contains types:

```ts
import type { CharacterService, SrdModApi, SrdModTag } from "@planarally/system-dnd-5e-srd";
```

At runtime the SRD mod is a separate mod that PlanarAlly loads on its own, and your mod reaches it through
`api.getModApi`. The package has no runtime entry, so importing it for anything but types fails to build.

## Using characters

### Getting the service

```ts
const SRD_MOD: SrdModTag = "srd-5-1";

function characterService(): CharacterService | undefined {
    return api.getModApi<SrdModApi>(SRD_MOD)?.character;
}
```

The lookup is reactive. It is `undefined` while the SRD mod is not loaded, and a `computed` or `watch` that calls it
follows the mod being enabled, disabled or reloaded.

### Reading a character

A character belongs to a shape, identified by its `LocalId`.

- `useCharacter(shape)` gives a reactive `EvaluatedCharacter`: the stored build plus everything derived from it, such
  as modifiers, saves, skills, proficiencies, armor class, hit point maximum, attacks, spellcasting and pending choices.
  Call it in a component's `setup` or another effect scope, since it holds a custom data lease on the shape while the
  scope lives. It accepts a ref or getter, so it can follow e.g. the currently selected shape. It is `undefined` until
  the character has loaded.
- `read(shape)` gives a one-off, non-reactive snapshot of the stored values, `undefined` until loaded.
- `ensure(shape)` creates any missing custom data fields and brings the derived ones in line with the build. The
  other methods call it as needed, so you rarely need it yourself.

The character data can only be read and changed by users with edit access to the shape.

```ts
const character = characterService()?.useCharacter(() => selectedShape.value);

const strength = computed(() => character?.value?.abilities["strength"]?.modifier);
```

To keep a sheet working while the SRD mod reloads, create a new scope whenever the service changes. See
`useOpenedCharacter` in the character sheet mod for an example.

### Changing a character

Use the service's setters. They save the change and update the derived fields, e.g. `setClassLevel` also raises the
skills and saves the new levels grant. They do nothing while the character is still loading.

```ts
const service = characterService();
service?.setClassLevel(shape, "fighter", 3);
service?.setAbilityScore(shape, "strength", 16);
service?.addItem(shape, { item: "longsword" });
service?.setState(shape, { hitPoints: { current: 18, temp: 0 } });
```

Setters for backgrounds, races, subclasses, spells and choices accept an id or a name, matched case-insensitively. A
background, race or subclass that matches no compendium entry is kept as free text, e.g. for a homebrew background
without an entry. Spells and choice picks that don't fit are dropped.

See `CharacterService` in [`src/types/character.ts`](src/types/character.ts) for every method and what it does.

Don't write the DataBlocks or derived custom data fields directly: the service keeps them consistent with each other.

### Rolling dice

The values that rolls need live in shape custom data, so dice expressions can refer to them. The evaluated character
also gives the references directly, e.g. `EvaluatedSkill.modifierReference` or `EvaluatedAttack.attack`.

| Reference                                    | Value                                                        |
| -------------------------------------------- | ------------------------------------------------------------ |
| `{str}`, `{dex}`, ...                        | Ability modifier, by the ability's abbreviation              |
| `{str_save}`, ...                            | Saving throw modifier                                        |
| `{str_score}`, `{str_increase}`, ...         | Base score, and the increase from grants                     |
| `{athletics}`, `{sleight_of_hand}`, ...      | Skill modifier, by the skill id with `-` replaced by `_`     |
| `{proficiency}`                              | Proficiency bonus                                            |
| `{level}`, `{fighter_level}`, ...            | Total level, and the level per class                         |
| `{wizard_spell_dc}`, `{wizard_spell_attack}` | Spell save DC and spell attack bonus, per spellcasting class |
| `{ac}`                                       | Armor class                                                  |
| `{initiative}`                               | Initiative modifier                                          |
| `{hp_max}`                                   | Hit point maximum                                            |

For example, `api.dice.roll("1d20 + {athletics}")` rolls an Athletics check for the shape the roll resolves against.

Abilities and skills come from the compendium, so a mod that adds one also adds its fields and references.

### How a character is stored

You don't need this to use the service, but it explains what you see on a shape:

- Three shape DataBlocks of the SRD mod hold the build (`character`), the play state (`state`, e.g. hit points and
  spent slots) and the inventory (`inventory`). Each is saved as a whole, so separate blocks keep e.g. a hit point
  change from overwriting an inventory change made at the same time.
- Custom data holds the values formulas and rolls use, listed above. Players can edit a score or adjust a formula, while
  the service maintains the fields that follow from the build, such as increases, levels and the armor class formula.

## Adding content

Register entries with `api.compendium.register` in your mod's `initGame`. An entry is read as character data when its
`schema` has `system: "dnd-5e"` and one of these kinds:

| Kind              | Data type            | Notes                                                 |
| ----------------- | -------------------- | ----------------------------------------------------- |
| `ability`         | `Ability`            | Its abbreviation becomes the custom data reference    |
| `skill`           | `Skill`              | Names the ability it uses                             |
| `language`        | `Language`           |                                                       |
| `background`      | `Background`         | Grants, starting equipment, feature, characteristics  |
| `race`, `subrace` | `Race`, `Subrace`    | A subrace names its race                              |
| `class`           | `CharacterClass`     | Levels, grants, spellcasting, resources, equipment    |
| `subclass`        | `Subclass`           | Names its class                                       |
| `spell`           | `Spell`              | Lists the classes whose spell list includes it        |
| `item`            | `Item`               | Weapons, armor, gear, tools and packs                 |
| `weapon-property` | `WeaponPropertyRule` | Rules text for a weapon property, linked from weapons |
| `condition`       | none                 | Rules text only                                       |

All data types are exported from this package. Use `satisfies CompendiumEntry<Spell>[]` or a typed helper so
TypeScript checks your entries against them.

```ts
import type { CompendiumEntry } from "@planarally/mod-api";
import type { Subclass } from "@planarally/system-dnd-5e-srd";

const lunar: CompendiumEntry<Subclass> = {
    id: "lunar",
    name: "Lunar Sorcery",
    body: "Your innate magic comes from the moon.",
    // The class's folder in the SRD mod's Classes collection
    path: ["Sorcerer"],
    schema: {
        system: "dnd-5e",
        kind: "subclass",
        data: {
            class: "sorcerer",
            name: "Lunar Sorcery",
            source: "Dragonlance: Shadow of the Dragon Queen",
            levels: [{ level: 1, grants: { spells: ["sacred-flame", "shield"] } }],
        },
    },
};

api.compendium.register([lunar], { name: "Classes" });
```

### Ids

- Data refers to other entries by their id, e.g. `class: "sorcerer"` or `skills: ["insight"]`. The types mark these
  as `CompendiumId<"class">`, `CompendiumId<"skill">` and so on. Plain strings are accepted, but an id of another
  kind is a type error.
- The character service looks entries up by id across every mod, so pick ids that won't clash with the SRD's or
  another mod's. A homebrew entry that reuses an SRD id makes it ambiguous which one a character gets.
- Choice ids, e.g. `{ id: "skills", count: 2, from: [...] }`, must stay stable once released: a character's picks are
  stored under them.

### Compendium layout

- Registering with the same collection name as the SRD mod (`Classes`, `Backgrounds`, `Spells`, ...) puts your entries
  in the same collection.
- `path` puts an entry in a folder, e.g. a subclass under its class's name, like the SRD mod does.
- Entry bodies are Markdown. Link to another entry with its ref, `${mod}/${id}`:
  `[poisoned](compendium:srd-5-1/poisoned)`.

The `dnd-5e-extras` package is a working example that adds a subclass, a background and a spell.
