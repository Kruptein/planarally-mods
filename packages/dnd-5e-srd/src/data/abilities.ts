import type { CompendiumEntry } from "@planarally/mod-api";

import type { Ability } from "../types/ability.ts";

export const abilities = [
    {
        id: "strength",
        name: "Strength",
        body: "Strength measures bodily power, athletic training, and the extent to which you can exert raw physical force.",
        schema: { system: "dnd-5e", kind: "ability", data: { abbreviation: "str" } },
    },
    {
        id: "dexterity",
        name: "Dexterity",
        body: "Dexterity measures agility, reflexes, and balance.",
        schema: { system: "dnd-5e", kind: "ability", data: { abbreviation: "dex" } },
    },
    {
        id: "constitution",
        name: "Constitution",
        body: "Constitution measures health, stamina, and vital force.",
        schema: { system: "dnd-5e", kind: "ability", data: { abbreviation: "con" } },
    },
    {
        id: "intelligence",
        name: "Intelligence",
        body: "Intelligence measures mental acuity, accuracy of recall, and the ability to reason.",
        schema: { system: "dnd-5e", kind: "ability", data: { abbreviation: "int" } },
    },
    {
        id: "wisdom",
        name: "Wisdom",
        body: "Wisdom reflects how attuned you are to the world around you and represents perceptiveness and intuition.",
        schema: { system: "dnd-5e", kind: "ability", data: { abbreviation: "wis" } },
    },
    {
        id: "charisma",
        name: "Charisma",
        body: "Charisma measures your ability to interact effectively with others. It includes such factors as confidence and eloquence, and it can represent a charming or commanding personality.",
        schema: { system: "dnd-5e", kind: "ability", data: { abbreviation: "cha" } },
    },
] satisfies CompendiumEntry<Ability>[];
