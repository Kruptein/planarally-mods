import type { CharacterDetails } from "@planarally/system-dnd-5e-srd";

export const ABILITIES = [
    { id: "str", label: "Strength", short: "STR" },
    { id: "dex", label: "Dexterity", short: "DEX" },
    { id: "con", label: "Constitution", short: "CON" },
    { id: "int", label: "Intelligence", short: "INT" },
    { id: "wis", label: "Wisdom", short: "WIS" },
    { id: "cha", label: "Charisma", short: "CHA" },
] as const;

export type AbilityId = (typeof ABILITIES)[number]["id"];

/** Values from the SRD character that the sheet's own calculations build on. */
export interface DerivedStats {
    proficiency: number;
    /** Keyed by abbreviation, e.g. "dex". A missing ability counts as 0. */
    modifiers: Readonly<Record<string, number>>;
    /** Skill modifiers keyed by compendium id, e.g. "perception". */
    skills: Readonly<Record<string, number>>;
}

/** What the pages edit in place; stored in the SRD character (see `useOpenedSheetCharacter`). */
export interface Character extends CharacterDetails {
    inspiration: boolean;
    /** Added to the armor class from the equipped armor. */
    armorClassBonus: number;
    initiativeBonus: number;
    /** The maximum comes from the SRD character. */
    hp: { current: number; temp: number };
    /** Spent hit dice; the total comes from the class levels. */
    hitDice: { spent: number };
    deathSaves: { successes: boolean[]; failures: boolean[] };
    /** Spent slots per spell level, 1st to 9th; the maxima come from the SRD classes. */
    spentSlots: number[];
    spentPactSlots: number;
    /** Used class resources by id, e.g. sorcery points. */
    spentResources: Record<string, number>;
}

let nextId = 1;

export function createId(): string {
    nextId += 1;
    return `sheet-${nextId}`;
}

/**
 * A leading `+` sets the bonus (`+1` stores 1). Any other number is the desired
 * total, and the bonus is the difference from `derived`. Empty clears the bonus.
 * Returns null when the text is not a number.
 */
export function commitBonus(raw: string, derived: number): number | null {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "+" || trimmed === "-") return 0;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    const value = Math.trunc(parsed);
    if (trimmed.startsWith("+")) return value;
    return value - derived;
}

export function signed(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
}

export function spellLevelName(level: number): string {
    if (level === 0) return "Cantrip";
    if (level === 1) return "1st";
    if (level === 2) return "2nd";
    if (level === 3) return "3rd";
    return `${level}th`;
}

export function modifierOf(stats: DerivedStats, ability: AbilityId): number {
    return stats.modifiers[ability] ?? 0;
}

export function derivedInitiative(stats: DerivedStats): number {
    return modifierOf(stats, "dex");
}

export function initiative(character: Character, stats: DerivedStats): number {
    return derivedInitiative(stats) + character.initiativeBonus;
}

export function derivedPassivePerception(stats: DerivedStats): number {
    return 10 + (stats.skills["perception"] ?? modifierOf(stats, "wis"));
}

export function passivePerception(character: Character, stats: DerivedStats): number {
    return derivedPassivePerception(stats) + character.passivePerceptionBonus;
}

export function createEmptyCharacter(): Character {
    return {
        name: "",
        xp: "",
        inspiration: false,
        armorClassBonus: 0,
        initiativeBonus: 0,
        speedBonus: 0,
        hp: { current: 0, temp: 0 },
        hitDice: { spent: 0 },
        deathSaves: { successes: [false, false, false], failures: [false, false, false] },
        attacks: [],
        otherProficiencies: "",
        features: [],
        notes: "",
        passivePerceptionBonus: 0,
        spentSlots: Array.from({ length: 9 }, () => 0),
        spentPactSlots: 0,
        spentResources: {},
    };
}

export function commitNumber(raw: string, fallback: number): number {
    const value = Math.trunc(Number(raw));
    return Number.isFinite(value) ? value : fallback;
}
