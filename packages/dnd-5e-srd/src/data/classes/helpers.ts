import type { CompendiumEntry } from "@planarally/mod-api";

import type { CharacterClass, ClassLevel, Subclass } from "../../types/class.ts";
import type { CompendiumId } from "../../types/compendium.ts";
import type { ChoiceOption, Grants, Trait } from "../../types/grants.ts";
import type { EquipmentGrant, StartingEquipment } from "../../types/item.ts";

export const SOURCE = "SRD 5.1";

function body(intro: string, levels: readonly ClassLevel[]): string {
    const lines = [intro];
    for (const level of levels) {
        for (const feature of level.features ?? []) {
            lines.push(`**${feature.name} (level ${level.level}).** ${feature.description}`);
        }
    }
    return lines.join("\n\n");
}

export function characterClass(
    id: CompendiumId<"class">,
    intro: string,
    data: CharacterClass,
): CompendiumEntry<CharacterClass> {
    const equipment = data.equipment?.map((line) => `- ${line.text}`).join("\n");
    const start = equipment === undefined ? intro : `${intro}\n\n**Starting Equipment.**\n\n${equipment}`;
    return { id, name: data.name, body: body(start, data.levels), schema: { system: "dnd-5e", kind: "class", data } };
}

export function subclass(id: CompendiumId<"subclass">, intro: string, data: Subclass): CompendiumEntry<Subclass> {
    return {
        id,
        name: data.name,
        body: body(intro, data.levels),
        schema: { system: "dnd-5e", kind: "subclass", data },
    };
}

const ASI_DESCRIPTION =
    "You can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature.";

export function asi(level: number): ClassLevel {
    return {
        level,
        features: [{ name: "Ability Score Improvement", description: ASI_DESCRIPTION }],
        grants: { abilityIncreases: [{ id: `asi-${level}`, count: 2, amount: 1, repeat: true }] },
    };
}

export function feature(name: string, description: string): Trait {
    return { name, description };
}

export { artisanTools, instruments } from "../items/tools.ts";

export function item(id: CompendiumId<"item">, quantity?: number): EquipmentGrant {
    return quantity === undefined ? { item: id } : { item: id, quantity };
}

export function anyOf(ids: CompendiumId<"item">[]): EquipmentGrant {
    return { from: ids };
}

// A line of starting equipment with the options to pick from, or a single option
export function line(text: string, ...options: EquipmentGrant[][]): StartingEquipment {
    return { text, options };
}

// A table indexed by class level - 1, from the levels where the value changes, e.g. steps({ 1: 2, 4: 3, 10: 4 })
export function steps(changes: Record<number, number>): number[] {
    const table: number[] = [];
    let value = 0;
    for (let level = 1; level <= 20; level++) {
        value = changes[level] ?? value;
        table.push(value);
    }
    return table;
}

// A level that only describes features
export function at(level: number, ...features: Trait[]): ClassLevel {
    return { level, features };
}

export function granting(level: ClassLevel, grants: Grants): ClassLevel {
    return { ...level, grants: { ...level.grants, ...grants } };
}

// Always prepared spells gained at a class level, e.g. domain spells
export function spellsAt(level: number, ...spells: CompendiumId<"spell">[]): ClassLevel {
    return { level, grants: { spells } };
}

export const EXPERTISE_DESCRIPTION =
    "Choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.";

// The Fighting Style feature as an option choice, limited to the styles a class offers
export function fightingStyle(level: number, id: string, ...styles: string[]): ClassLevel {
    return {
        level,
        features: [feature("Fighting Style", "You adopt a particular style of fighting as your specialty.")],
        grants: {
            options: [
                {
                    id,
                    name: "Fighting Style",
                    options: fightingStyles.filter((style) => styles.length === 0 || styles.includes(style.id)),
                },
            ],
        },
    };
}

export const fightingStyles: ChoiceOption[] = [
    {
        id: "archery",
        name: "Archery",
        description: "You gain a +2 bonus to attack rolls you make with ranged weapons.",
    },
    {
        id: "defense",
        name: "Defense",
        description: "While you are wearing armor, you gain a +1 bonus to AC.",
    },
    {
        id: "dueling",
        name: "Dueling",
        description:
            "When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.",
    },
    {
        id: "great-weapon-fighting",
        name: "Great Weapon Fighting",
        description:
            "When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the two-handed or versatile property.",
    },
    {
        id: "protection",
        name: "Protection",
        description:
            "When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.",
    },
    {
        id: "two-weapon-fighting",
        name: "Two-Weapon Fighting",
        description:
            "When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.",
    },
];
