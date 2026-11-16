import type { CompendiumEntry } from "@planarally/mod-api";

import type { Language } from "../types/language.ts";

function language(
    id: string,
    name: string,
    type: Language["type"],
    speakers: string,
    script: string | null,
): CompendiumEntry<Language> {
    const body = `${type === "standard" ? "Standard" : "Exotic"} language. Typical speakers: ${speakers}. Script: ${script ?? "none"}.`;
    return { id, name, body, schema: { system: "dnd-5e", kind: "language", data: { type, script, speakers } } };
}

export const languages = [
    language("common", "Common", "standard", "Humans", "Common"),
    language("dwarvish", "Dwarvish", "standard", "Dwarves", "Dwarvish"),
    language("elvish", "Elvish", "standard", "Elves", "Elvish"),
    language("giant", "Giant", "standard", "Ogres, giants", "Dwarvish"),
    language("gnomish", "Gnomish", "standard", "Gnomes", "Dwarvish"),
    language("goblin", "Goblin", "standard", "Goblinoids", "Dwarvish"),
    language("halfling", "Halfling", "standard", "Halflings", "Common"),
    language("orc", "Orc", "standard", "Orcs", "Dwarvish"),
    language("abyssal", "Abyssal", "exotic", "Demons", "Infernal"),
    language("celestial", "Celestial", "exotic", "Celestials", "Celestial"),
    language("draconic", "Draconic", "exotic", "Dragons, dragonborn", "Draconic"),
    language("deep-speech", "Deep Speech", "exotic", "Aboleths, cloakers", null),
    language("infernal", "Infernal", "exotic", "Devils", "Infernal"),
    language("primordial", "Primordial", "exotic", "Elementals", "Dwarvish"),
    language("sylvan", "Sylvan", "exotic", "Fey creatures", "Elvish"),
    language("undercommon", "Undercommon", "exotic", "Underworld traders", "Elvish"),
];
