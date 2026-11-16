import type { CompendiumId } from "./compendium.ts";
import type { Grants, Trait } from "./grants.ts";
import type { StartingEquipment } from "./item.ts";

// What a class or subclass gives when a level is reached
export interface ClassLevel {
    level: number;
    features?: Trait[];
    grants?: Grants;
}

// How the class levels count towards spell slots: full casters 1 per level, half casters 1 per 2 levels.
// Pact magic has its own slots that recharge on a short rest.
export type CasterProgression = "full" | "half" | "pact";

// Known casters pick a fixed number of spells, prepared casters prepare from the whole class list each day,
// spellbook casters prepare from the spells in their book
export type SpellPreparation = "known" | "prepared" | "spellbook";

export interface ClassSpellcasting {
    ability: CompendiumId<"ability">;
    progression: CasterProgression;
    preparation: SpellPreparation;
    // Indexed by class level - 1
    cantripsKnown?: number[];
    // Known spells, or the spells in the book of a spellbook caster, indexed by class level - 1
    spellsKnown?: number[];
    // Prepared and spellbook casters prepare their ability modifier + class level × this many spells, at least 1
    preparedLevelFactor?: number;
}

// A pool of uses, e.g. sorcery points
export interface ClassResource {
    id: string;
    name: string;
    // Indexed by class level - 1
    max: number[];
    recharge: "short" | "long";
}

// The grants on the class itself apply to the starting class only, e.g. its saving throws
export interface CharacterClass extends Grants {
    // Default English name
    name: string;
    // Source book
    source: string;
    hitDie: number;
    // What taking the class as a later class gives instead of the starting grants
    multiclass?: Grants;
    // The class level at which the subclass is chosen
    subclassLevel: number;
    // What the class calls its subclasses, e.g. "Martial Archetype"
    subclassTitle: string;
    // Starting equipment of the starting class
    equipment?: StartingEquipment[];
    levels: ClassLevel[];
    spellcasting?: ClassSpellcasting;
    resources?: ClassResource[];
}

export interface Subclass {
    class: CompendiumId<"class">;
    // Default English name
    name: string;
    // Source book
    source: string;
    // Class levels
    levels: ClassLevel[];
}
