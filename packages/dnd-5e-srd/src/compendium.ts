import type { CompendiumEntry, GameApi } from "@planarally/mod-api";

import { SYSTEM } from "./character/schema.ts";
import { abilities } from "./data/abilities.ts";
import { backgrounds } from "./data/backgrounds.ts";
import { classCollection } from "./data/classes/index.ts";
import { conditions } from "./data/conditions.ts";
import { itemCollection, items, weaponProperties } from "./data/items/index.ts";
import { languages } from "./data/languages.ts";
import { raceCollection } from "./data/races.ts";
import { skills } from "./data/skills.ts";
import { spells } from "./data/spells/index.ts";

export function addCompendiumEntries(api: GameApi) {
    api.compendium.register(wrapInKind(abilities, "ability"), {
        name: "Abilities",
    });

    api.compendium.register(wrapInKind(backgrounds, "background"), {
        name: "Backgrounds",
    });

    api.compendium.register(classCollection(), {
        name: "Classes",
    });

    api.compendium.register(conditions, {
        name: "Conditions",
    });

    api.compendium.register([...items, ...weaponProperties], itemCollection);

    api.compendium.register(wrapInKind(languages, "language"), {
        name: "Languages",
        views: [{ at: [], name: "Type", by: "type" }],
    });

    api.compendium.register(raceCollection(), {
        name: "Races",
    });

    api.compendium.register(wrapInKind(skills, "skill"), {
        name: "Skills",
    });

    api.compendium.register(spells, {
        name: "Spells",
        views: [
            {
                at: [],
                name: "Level",
                by: "level",
                order: ["Cantrip", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"],
            },
            { at: [], name: "School", by: "school" },
        ],
    });
}

type UnwrappedEntry = Omit<CompendiumEntry, "schema"> & { schema?: { data?: unknown } };

function wrapInKind(data: UnwrappedEntry[], kind: string): CompendiumEntry[] {
    return data.map((item) => ({ ...item, schema: { ...item.schema, system: SYSTEM, kind } }));
}
