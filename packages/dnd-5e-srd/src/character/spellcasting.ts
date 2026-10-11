import type { PactSlots } from "../types/character.ts";
import type { ClassSpellcasting } from "../types/class.ts";

// Spell slots per spell level (1st to 9th) by caster level, as on the Multiclass Spellcaster table
const SLOTS: readonly (readonly number[])[] = [
    [2],
    [3],
    [4, 2],
    [4, 3],
    [4, 3, 2],
    [4, 3, 3],
    [4, 3, 3, 1],
    [4, 3, 3, 2],
    [4, 3, 3, 3, 1],
    [4, 3, 3, 3, 2],
    [4, 3, 3, 3, 2, 1],
    [4, 3, 3, 3, 2, 1],
    [4, 3, 3, 3, 2, 1, 1],
    [4, 3, 3, 3, 2, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

// Always nine entries, one per spell level
export function slotsAt(casterLevel: number): number[] {
    const row = casterLevel < 1 ? [] : (SLOTS[Math.min(casterLevel, 20) - 1] ?? []);
    return Array.from({ length: 9 }, (_, index) => row[index] ?? 0);
}

export interface CasterClass {
    level: number;
    spellcasting: ClassSpellcasting;
}

// The caster level of a class on its own, which is how it reads the slot table when it is the only caster class
function ownCasterLevel({ level, spellcasting }: CasterClass): number {
    if (spellcasting.progression === "full") return level;
    if (spellcasting.progression === "half") return level < 2 ? 0 : Math.ceil(level / 2);
    return 0;
}

// Pact magic stays separate, so warlock levels add nothing here
export function spellSlots(classes: readonly CasterClass[]): number[] {
    const casters = classes.filter((caster) => caster.spellcasting.progression !== "pact");
    if (casters.length === 1) return slotsAt(ownCasterLevel(casters[0]!));
    let casterLevel = 0;
    for (const { level, spellcasting } of casters) {
        casterLevel += spellcasting.progression === "full" ? level : Math.floor(level / 2);
    }
    return slotsAt(casterLevel);
}

export function pactSlots(level: number): PactSlots | undefined {
    if (level < 1) return undefined;
    const count = level >= 17 ? 4 : level >= 11 ? 3 : level >= 2 ? 2 : 1;
    return { count, level: Math.min(5, Math.ceil(level / 2)) };
}

// The highest spell level the class can learn or prepare, from its own table. 0 before it can cast spells.
export function maxSpellLevel(caster: CasterClass): number {
    if (caster.spellcasting.progression === "pact") return pactSlots(caster.level)?.level ?? 0;
    const slots = slotsAt(ownCasterLevel(caster));
    return slots.filter((count) => count > 0).length;
}

export interface SpellLimits {
    cantrips: number | undefined;
    known: number | undefined;
    // Undefined while the ability modifier is pending
    prepared: number | undefined;
}

export function spellLimits(caster: CasterClass, abilityModifier: number | undefined): SpellLimits {
    const { level, spellcasting } = caster;
    const factor = spellcasting.preparedLevelFactor;
    let prepared: number | undefined;
    if (factor !== undefined && abilityModifier !== undefined) {
        prepared = maxSpellLevel(caster) === 0 ? 0 : Math.max(1, abilityModifier + Math.floor(level * factor));
    }
    return {
        cantrips: spellcasting.cantripsKnown?.[level - 1],
        known: spellcasting.spellsKnown?.[level - 1],
        prepared,
    };
}
