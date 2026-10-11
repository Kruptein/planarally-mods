import type { CompendiumRecord } from "@planarally/mod-api";

import type { Ability } from "../types/ability.ts";
import type { CharacterField, DiceExpressionField, NumberField } from "../types/character.ts";
import type { CharacterClass } from "../types/class.ts";
import type { CompendiumId, CompendiumRef } from "../types/compendium.ts";
import type { Skill } from "../types/skill.ts";

export const SYSTEM = "dnd-5e";

export interface AbilityInfo {
    id: CompendiumId<"ability">;
    name: string;
    abbreviation: string;
    ref: CompendiumRef;
}

export function listAbilities(records: readonly CompendiumRecord<Ability>[]): AbilityInfo[] {
    const ids = new Set<string>();
    const abbreviations = new Set<string>();
    const abilities: AbilityInfo[] = [];
    for (const record of records) {
        const abbreviation = record.schema.data?.abbreviation?.toLowerCase() ?? "";
        if (!/^\w+$/.test(abbreviation)) {
            console.warn(`[${SYSTEM}] Ability ${record.ref} has no valid abbreviation and is ignored.`);
            continue;
        }
        if (ids.has(record.id) || abbreviations.has(abbreviation)) {
            console.warn(`[${SYSTEM}] Ability ${record.ref} reuses an id or abbreviation and is ignored.`);
            continue;
        }
        ids.add(record.id);
        abbreviations.add(abbreviation);
        abilities.push({ id: record.id, name: record.name, abbreviation, ref: record.ref });
    }
    return abilities;
}

// Kept in line with the class levels by the service
export const totalLevelField: NumberField = {
    prefix: "/class",
    name: "level",
    kind: "number",
    default: 0,
    reference: "level",
    label: "Total level",
};

// 2 at levels 1-4 up to 6 at 17-20; a character without levels counts as level 1
export const proficiencyBonusField: DiceExpressionField = {
    prefix: "/proficiency",
    name: "bonus",
    kind: "dice-expression",
    default: `ceil(max({${totalLevelField.reference}}, 1) / 4) + 1`,
    reference: "proficiency",
    label: "Proficiency bonus",
};

export interface ClassInfo {
    id: CompendiumId<"class">;
    name: string;
    hitDie: number;
    // Custom data reference prefix, derived from the id, e.g. "fighter"
    reference: string;
    data: CharacterClass;
}

export function listClasses(records: readonly CompendiumRecord<CharacterClass>[]): ClassInfo[] {
    const references = new Set<string>();
    const classes: ClassInfo[] = [];
    for (const record of records) {
        const data = record.schema.data;
        const reference = record.id.toLowerCase().replaceAll(/\W/g, "_");
        if (data?.hitDie === undefined || references.has(reference)) {
            console.warn(`[${SYSTEM}] Class ${record.ref} has no hit die or reuses a reference and is ignored.`);
            continue;
        }
        references.add(reference);
        classes.push({ id: record.id, name: record.name, hitDie: data.hitDie, reference, data });
    }
    return classes;
}

// Mirrors the class level of the build, so formulas and rolls can use it.
// Only present while the character has the class.
export function classLevelField(info: ClassInfo): NumberField {
    return {
        prefix: `/classes/${info.id}`,
        name: "level",
        kind: "number",
        default: 0,
        reference: `${info.reference}_level`,
        label: `${info.name} level`,
    };
}

// Created once the class has a level
export interface ClassSpellFormulas {
    saveDc: DiceExpressionField;
    attackBonus: DiceExpressionField;
}

export function classSpellFormulas(info: ClassInfo, ability: AbilityInfo): ClassSpellFormulas {
    const prefix = `/spells/${info.id}`;
    return {
        saveDc: {
            prefix,
            name: "saveDc",
            kind: "dice-expression",
            default: `8 + {${proficiencyBonusField.reference}} + {${ability.abbreviation}}`,
            reference: `${info.reference}_spell_dc`,
            label: `${info.name} spell save DC`,
        },
        attackBonus: {
            prefix,
            name: "attackBonus",
            kind: "dice-expression",
            default: `{${proficiencyBonusField.reference}} + {${ability.abbreviation}}`,
            reference: `${info.reference}_spell_attack`,
            label: `${info.name} spell attack bonus`,
        },
    };
}

// The class part of the hit point maximum: the full hit die at 1st level of the starting class and the
// fixed average for every other level. Kept in line with the classes by the service.
export const hitPointBaseField: NumberField = {
    prefix: "/hit-points",
    name: "base",
    kind: "number",
    default: 0,
    reference: "hp_base",
    label: "Hit point base",
};

export const hitPointBonusField: NumberField = {
    prefix: "/hit-points",
    name: "bonus",
    kind: "number",
    default: 0,
    reference: "hp_bonus",
    label: "Hit point bonus",
};

export const hitPointMaxField: DiceExpressionField = {
    prefix: "/hit-points",
    name: "max",
    kind: "dice-expression",
    default: `{${hitPointBaseField.reference}} + {con} * {${totalLevelField.reference}} + {${hitPointBonusField.reference}}`,
    reference: "hp_max",
    label: "Hit point maximum",
};

export const armorClassBonusField: NumberField = {
    prefix: "/combat",
    name: "armorClassBonus",
    kind: "number",
    default: 0,
    reference: "ac_bonus",
    label: "Armor class bonus",
};

// The service rewrites the formula whenever the equipped armor changes, adjustments go to the bonus
export function armorClassField(formula: string): DiceExpressionField {
    return {
        prefix: "/combat",
        name: "armorClass",
        kind: "dice-expression",
        default: formula,
        reference: "ac",
        label: "Armor class",
    };
}

export function unarmoredFormula(dexterity: AbilityInfo | undefined): string {
    const dex = dexterity === undefined ? "" : ` + {${dexterity.abbreviation}}`;
    return `10${dex} + {${armorClassBonusField.reference}}`;
}

export const initiativeBonusField: NumberField = {
    prefix: "/combat",
    name: "initiativeBonus",
    kind: "number",
    default: 0,
    reference: "initiative_bonus",
    label: "Initiative bonus",
};

export function initiativeField(dexterity: AbilityInfo): DiceExpressionField {
    return {
        prefix: "/combat",
        name: "initiative",
        kind: "dice-expression",
        default: `{${dexterity.abbreviation}} + {${initiativeBonusField.reference}}`,
        reference: "initiative",
        label: "Initiative",
    };
}

// Initiative uses the Dexterity modifier, so it is only there when Dexterity is registered
export function dexterityOf(abilities: readonly AbilityInfo[]): AbilityInfo | undefined {
    return abilities.find((ability) => ability.abbreviation === "dex");
}

export interface AbilityFields {
    // The base score, without increases from grants
    score: NumberField;
    // Kept in line with the race and subrace by the service
    increase: NumberField;
    modifier: DiceExpressionField;
    // A multiplier for the proficiency bonus: 0 is not proficient, 1 is proficient.
    // Dice math has no booleans, so a number lets the save formula use it directly.
    saveProficiency: NumberField;
    save: DiceExpressionField;
}

export function abilityFields(ability: AbilityInfo): AbilityFields {
    const scoreReference = `${ability.abbreviation}_score`;
    const increaseReference = `${ability.abbreviation}_increase`;
    const saveProficiencyReference = `${ability.abbreviation}_save_proficiency`;
    const score: NumberField = {
        prefix: "/abilities/scores",
        name: ability.id,
        kind: "number",
        default: 10,
        reference: scoreReference,
        label: ability.name,
        compendiumRef: ability.ref,
    };
    const increase: NumberField = {
        prefix: "/abilities/increases",
        name: ability.id,
        kind: "number",
        default: 0,
        reference: increaseReference,
        label: `${ability.name} increase`,
        compendiumRef: ability.ref,
    };
    const modifier: DiceExpressionField = {
        prefix: "/abilities/modifiers",
        name: ability.id,
        kind: "dice-expression",
        default: `floor(({${scoreReference}} + {${increaseReference}} - 10) / 2)`,
        reference: ability.abbreviation,
        label: `${ability.name} modifier`,
        compendiumRef: ability.ref,
    };
    const saveProficiency: NumberField = {
        prefix: "/saves/proficiencies",
        name: ability.id,
        kind: "number",
        default: 0,
        reference: saveProficiencyReference,
        label: `${ability.name} save proficiency`,
        compendiumRef: ability.ref,
    };
    const save: DiceExpressionField = {
        prefix: "/saves/modifiers",
        name: ability.id,
        kind: "dice-expression",
        default: `{${ability.abbreviation}} + {${saveProficiencyReference}} * {${proficiencyBonusField.reference}}`,
        reference: `${ability.abbreviation}_save`,
        label: `${ability.name} saving throw`,
        compendiumRef: ability.ref,
    };
    return { score, increase, modifier, saveProficiency, save };
}

export interface SkillInfo {
    id: CompendiumId<"skill">;
    name: string;
    ref: CompendiumRef;
    // Custom data reference, derived from the id, e.g. "sleight_of_hand"
    reference: string;
    ability: AbilityInfo;
}

export function listSkills(
    records: readonly CompendiumRecord<Skill>[],
    abilities: readonly AbilityInfo[],
): SkillInfo[] {
    const ids = new Set<string>();
    const references = new Set(abilities.map((ability) => ability.abbreviation));
    const skills: SkillInfo[] = [];
    for (const record of records) {
        const ability = abilities.find((ability) => ability.id === record.schema.data?.ability);
        if (ability === undefined) {
            console.warn(`[${SYSTEM}] Skill ${record.ref} has no known ability and is ignored.`);
            continue;
        }
        const reference = record.id.toLowerCase().replaceAll(/\W/g, "_");
        if (ids.has(record.id) || references.has(reference)) {
            console.warn(`[${SYSTEM}] Skill ${record.ref} reuses an id or reference and is ignored.`);
            continue;
        }
        ids.add(record.id);
        references.add(reference);
        skills.push({ id: record.id, name: record.name, ref: record.ref, reference, ability });
    }
    return skills;
}

export interface SkillFields {
    // A multiplier for the proficiency bonus, rounded down after multiplying:
    // 0 is not proficient, 0.5 is half proficiency, 1 is proficient and 2 is expertise.
    proficiency: NumberField;
    modifier: DiceExpressionField;
}

export function skillFields(skill: SkillInfo): SkillFields {
    const proficiencyReference = `${skill.reference}_proficiency`;
    const proficiency: NumberField = {
        prefix: "/skills/proficiencies",
        name: skill.id,
        kind: "number",
        default: 0,
        reference: proficiencyReference,
        label: `${skill.name} proficiency`,
        compendiumRef: skill.ref,
    };
    const modifier: DiceExpressionField = {
        prefix: "/skills/modifiers",
        name: skill.id,
        kind: "dice-expression",
        default: `{${skill.ability.abbreviation}} + floor({${proficiencyReference}} * {${proficiencyBonusField.reference}})`,
        reference: skill.reference,
        label: skill.name,
        compendiumRef: skill.ref,
    };
    return { proficiency, modifier };
}

// The fields every character has. Class levels and spell formulas follow the build.
export function describeCharacter(abilities: readonly AbilityInfo[], skills: readonly SkillInfo[]): CharacterField[] {
    const fields: CharacterField[] = [
        totalLevelField,
        proficiencyBonusField,
        hitPointBaseField,
        hitPointBonusField,
        hitPointMaxField,
        armorClassBonusField,
        initiativeBonusField,
    ];
    const dexterity = dexterityOf(abilities);
    fields.push(armorClassField(unarmoredFormula(dexterity)));
    if (dexterity !== undefined) fields.push(initiativeField(dexterity));
    for (const ability of abilities) {
        const { score, increase, modifier, saveProficiency, save } = abilityFields(ability);
        fields.push(score, increase, modifier, saveProficiency, save);
    }
    for (const skill of skills) {
        const { proficiency, modifier } = skillFields(skill);
        fields.push(proficiency, modifier);
    }
    return fields;
}
