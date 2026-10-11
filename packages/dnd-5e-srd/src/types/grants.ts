import type { CompendiumId, CompendiumKind } from "./compendium.ts";

// An entry that is always granted, or a choice the player still has to make.
// Armor and weapon proficiencies can also be a group: "light-armor", "medium-armor", "heavy-armor", "shields",
// "simple-weapons" or "martial-weapons". Anything else outside the compendium, e.g. a vehicle, is its name.
export type Grant<K extends CompendiumKind> = CompendiumId<K> | Choice<K>;

export interface Choice<K extends CompendiumKind> {
    // Stable and unique within its source, across every kind of choice: the picks are stored under it
    id: string;
    count: number;
    // Ids to choose from. Every compendium entry of the kind when omitted, required for armor, weapons and tools.
    from?: CompendiumId<K>[];
}

// An armor class without armor, e.g. a barbarian's 10 + Dexterity + Constitution
export interface UnarmoredDefense {
    base: number;
    // Abilities whose modifiers add to the base, besides Dexterity
    abilities: CompendiumId<"ability">[];
    // Whether it still applies while using a shield
    shield: boolean;
}

export interface AbilityIncrease {
    ability: CompendiumId<"ability">;
    amount: number;
}

export interface AbilityIncreaseChoice extends Choice<"ability"> {
    // Added to each picked ability
    amount: number;
    // Whether an ability can be picked more than once, e.g. an Ability Score Improvement:
    // two picks of +1 can go to one ability for +2
    repeat?: boolean;
}

// A choice between options described by the source itself, e.g. a draconic ancestry
export interface OptionChoice {
    id: string;
    name: string;
    options: ChoiceOption[];
}

export interface ChoiceOption {
    id: string;
    name: string;
    description: string;
    // Applied while the option is picked. Only fixed grants: an option has no choices of its own.
    grants?: Grants;
}

// A spell that is gained once a level is reached: the class level for class and subclass sources,
// the character level for others
export interface LevelledSpell {
    spell: CompendiumId<"spell">;
    level: number;
}

export interface SpellChoice extends Choice<"spell"> {
    // Limits the options to a class spell list
    list?: CompendiumId<"class">;
    // Limits the options to a spell level, 0 for cantrips
    level?: number;
}

// Granted spells are always prepared and don't count against the known or prepared limits
export type SpellGrant = CompendiumId<"spell"> | LevelledSpell | SpellChoice;

export interface Trait {
    name: string;
    description: string;
}

// What a background, race, class or subclass gives a character
export interface Grants {
    abilityIncreases?: (AbilityIncrease | AbilityIncreaseChoice)[];
    savingThrows?: CompendiumId<"ability">[];
    skills?: Grant<"skill">[];
    // Skills whose proficiency doubles
    expertise?: Grant<"skill">[];
    languages?: Grant<"language">[];
    armor?: Grant<"item">[];
    weapons?: Grant<"item">[];
    tools?: Grant<"item">[];
    options?: OptionChoice[];
    spells?: SpellGrant[];
    // For the granted spells. Class and subclass spells use the class spellcasting ability.
    spellcastingAbility?: CompendiumId<"ability">;
    // Added to the spell list of the class, e.g. a warlock patron's expanded spells
    expandedSpells?: CompendiumId<"spell">[];
    unarmoredDefense?: UnarmoredDefense;
}
