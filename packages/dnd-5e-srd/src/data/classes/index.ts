import type { CompendiumEntry } from "@planarally/mod-api";

import { barbarian, berserker } from "./barbarian.ts";
import { bard, lore } from "./bard.ts";
import { cleric, life } from "./cleric.ts";
import { druid, land } from "./druid.ts";
import { champion, fighter } from "./fighter.ts";
import { monk, openHand } from "./monk.ts";
import { devotion, paladin } from "./paladin.ts";
import { hunter, ranger } from "./ranger.ts";
import { rogue, thief } from "./rogue.ts";
import { draconic, sorcerer } from "./sorcerer.ts";
import { fiend, warlock } from "./warlock.ts";
import { evocation, wizard } from "./wizard.ts";

export const classes = [
    barbarian,
    bard,
    cleric,
    druid,
    fighter,
    monk,
    paladin,
    ranger,
    rogue,
    sorcerer,
    warlock,
    wizard,
];

export const subclasses = [
    berserker,
    lore,
    life,
    land,
    champion,
    openHand,
    devotion,
    hunter,
    thief,
    draconic,
    fiend,
    evocation,
];

// Registered as one collection: each class gets a folder holding the class and its subclasses
export function classCollection(): CompendiumEntry[] {
    const parents = new Map(classes.map((entry) => [entry.id, entry.name]));
    return [
        ...classes.map((entry) => ({ ...entry, path: [entry.name] })),
        ...subclasses.map((entry) => {
            const parent = parents.get(entry.schema?.data?.class ?? "");
            return parent === undefined ? entry : { ...entry, path: [parent] };
        }),
    ];
}
