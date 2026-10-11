import type { DiceSimplification, LocalId, PendingDiceSimplification } from "@planarally/mod-api";
import type { MaybeRefOrGetter, Ref } from "vue";

import type { SpellPreparation } from "./class.ts";
import type { CompendiumId, CompendiumKind, CompendiumRef } from "./compendium.ts";
import type { CoinUnit, Coins, Item } from "./item.ts";

// The SRD mod's tag. `api.getModApi<SrdModApi>(tag)` returns its api, undefined while the mod is not loaded.
// The lookup is reactive, so a computed or watch follows the mod reloading.
export type SrdModTag = "srd-5-1";

export interface SrdModApi {
    character: CharacterService;
}

interface FieldBase {
    prefix: string;
    // Stable key, never localised. Display text comes from `label` or the `compendiumRef` entry.
    name: string;
    reference: string | null;
    label: string;
    compendiumRef?: CompendiumRef;
}

export interface NumberField extends FieldBase {
    kind: "number";
    default: number;
}

export interface TextField extends FieldBase {
    kind: "text";
    default: string;
}

export interface BooleanField extends FieldBase {
    kind: "boolean";
    default: boolean;
}

export interface DiceExpressionField extends FieldBase {
    kind: "dice-expression";
    default: string;
}

export type CharacterField = NumberField | TextField | BooleanField | DiceExpressionField;

export interface AbilityValues {
    score: number;
    // Multiplier for the proficiency bonus on saving throws: 0 is not proficient, 1 is proficient.
    saveProficiency: number;
}

export interface SkillValues {
    // Multiplier for the proficiency bonus, rounded down after multiplying:
    // 0 is not proficient, 0.5 is half proficiency, 1 is proficient and 2 is expertise.
    proficiency: number;
}

// A chosen background, race or subrace
export interface SourceValues<K extends CompendiumKind> {
    // Undefined when nothing is set or the name matches no compendium entry.
    id: CompendiumId<K> | undefined;
    // The entry's name, or the stored text for an entry outside the compendium.
    name: string;
    // Picks for the entry's choices, keyed by choice id.
    choices: Record<string, string[]>;
}

export type Characteristic = "personalityTraits" | "ideals" | "bonds" | "flaws";
export type Characteristics = Record<Characteristic, string>;

export type SpellList = "cantrips" | "known" | "prepared";

export interface ClassValues {
    id: CompendiumId<"class">;
    name: string;
    level: number;
    // Only resolves to an id when the subclass belongs to the class.
    subclass: SourceValues<"subclass">;
    // Picks for the class choices, keyed by choice id.
    choices: Record<string, string[]>;
    // The spells the player chose for the class. Known spells are the spellbook of a wizard,
    // prepared spells are chosen from the class list or, for a spellbook, from the known spells.
    spells: Record<SpellList, CompendiumId<"spell">[]>;
}

// An attack the player adds, next to the ones of the equipped weapons
export interface Attack {
    id: string;
    name: string;
    // The ability whose modifier the rolls add, empty for none
    ability: CompendiumId<"ability">;
    proficient: boolean;
    // Added to the attack roll, on top of the ability modifier and proficiency bonus
    attackBonus: number;
    // Dice expression, e.g. "1d8"
    damage: string;
    // Whether the damage roll adds the ability modifier
    damageAbility: boolean;
    damageBonus: number;
    damageType: string;
    // Free text, e.g. "reach" or "magical"
    tags: string[];
}

export interface InventoryItem {
    // Unique within the inventory
    id: string;
    // Undefined for an item outside the compendium
    item?: CompendiumId<"item">;
    // Shown for an item outside the compendium, or when its entry is no longer registered
    name: string;
    quantity: number;
    // Equipped armor and shields count towards the armor class, equipped weapons are listed as attacks
    equipped: boolean;
    // A magic bonus, e.g. 1 for a +1 longsword: to the attack and damage rolls of a weapon, to the armor class of
    // armor or a shield
    bonus: number;
    // In pounds per piece, for an item outside the compendium
    weight?: number;
    notes: string;
}

export interface Inventory {
    items: InventoryItem[];
    coins: Coins;
    // The sources whose starting equipment was added, as `kind/id`, e.g. "class/fighter"
    startingEquipment: string[];
}

// What `addItem` adds: a compendium item, or an item outside the compendium by name
export interface NewItem {
    item?: CompendiumId<"item">;
    name?: string;
    quantity?: number;
    weight?: number;
}

// A feature the player adds, e.g. one from outside the compendium
export interface Feature {
    id: string;
    name: string;
    text: string;
}

// Free text and adjustments kept with the build
export interface CharacterDetails {
    name: string;
    xp: string;
    // Added to the race speed, e.g. for a class feature
    speedBonus: number;
    passivePerceptionBonus: number;
    attacks: Attack[];
    features: Feature[];
    otherProficiencies: string;
    notes: string;
}

// What changes during play. The maxima come from the build.
export interface CharacterState {
    hitPoints: { current: number; temp: number };
    spentHitDice: number;
    deathSaves: { successes: boolean[]; failures: boolean[] };
    inspiration: boolean;
    // Per spell level, 1st to 9th
    spentSlots: number[];
    spentPactSlots: number;
    // By resource id, e.g. sorcery points
    spentResources: Record<string, number>;
}

export interface Character5e {
    // The version of the stored build
    schemaVersion: number;
    details: CharacterDetails;
    state: CharacterState;
    inventory: Inventory;
    // Added to the armor class from the equipped armor, e.g. for the Defense fighting style
    armorClassBonus: number;
    // Added to the Dexterity modifier for initiative
    initiativeBonus: number;
    // Classes with at least one level, the starting class first.
    classes: ClassValues[];
    // The sum of the class levels
    level: number;
    // Added to the hit point maximum, e.g. for rolled hit points or Dwarven Toughness
    hitPointBonus: number;
    // E.g. "strength". The score excludes increases from grants.
    abilities: Record<CompendiumId<"ability">, AbilityValues>;
    // E.g. "sleight-of-hand".
    skills: Record<CompendiumId<"skill">, SkillValues>;
    background: SourceValues<"background">;
    race: SourceValues<"race">;
    // Only resolves to an id when the subrace belongs to the current race.
    subrace: SourceValues<"subrace">;
    alignment: string;
    // Languages known through the player's own choice, not through a grant.
    // Compendium ids, or the stored text for a language outside the compendium.
    languages: string[];
    characteristics: Characteristics;
}

// What grants a proficiency, language, increase or trait.
export interface GrantSource {
    kind: "background" | "race" | "subrace" | "class" | "subclass";
    id: CompendiumId<GrantSource["kind"]>;
    name: string;
}

export interface SourcedValue<T> {
    value: T;
    source: GrantSource;
}

export interface AbilityIncreaseSource {
    source: GrantSource;
    amount: number;
}

export interface EvaluatedAbility extends AbilityValues {
    // The sum of `increases`, added to the score by the modifier formula.
    increase: number;
    increases: AbilityIncreaseSource[];
    modifier: DiceSimplification | PendingDiceSimplification;
    save: DiceSimplification | PendingDiceSimplification;
    // Grants raise the save proficiency once, like skills.
    saveSources: GrantSource[];
    // Dice expression references that resolve against the character's shape, e.g. for `api.dice.roll("1d20 + " + ...)`
    modifierReference: string;
    saveReference: string;
}

export interface EvaluatedSkill extends SkillValues {
    modifier: DiceSimplification | PendingDiceSimplification;
    // A grant raises the proficiency once, so a skill can have sources and still be unticked.
    sources: GrantSource[];
    // Raised to expertise (2) once, like proficiency.
    expertiseSources: GrantSource[];
    // Dice expression reference to the modifier, resolving against the character's shape
    modifierReference: string;
}

export interface EvaluatedLanguage {
    // Compendium id, or the stored text for a language outside the compendium.
    id: string;
    // Known through the player's own choice
    own: boolean;
    sources: GrantSource[];
}

// An armor, weapon or tool proficiency
export interface EvaluatedGrantItem {
    // An item compendium id, a proficiency group such as "martial-weapons", or the stored text for anything else
    id: string;
    name: string;
    sources: GrantSource[];
}

export interface EvaluatedTrait {
    name: string;
    description: string;
    source: GrantSource;
    // The class level a class or subclass feature is gained at
    level?: number;
}

export interface ChoiceEntry {
    id: string;
    name: string;
    // Only for option choices, e.g. what a draconic ancestry gives
    description?: string;
}

export interface EvaluatedChoice {
    // Unique within its source
    id: string;
    kind: "ability" | "skill" | "expertise" | "language" | "armor" | "weapon" | "tool" | "option" | "spell";
    // Only for option choices, e.g. "Draconic Ancestry"
    name?: string;
    count: number;
    // Only for ability choices: added to each picked ability
    amount?: number;
    // Whether an option can be picked more than once
    repeat?: boolean;
    options: ChoiceEntry[];
    picked: ChoiceEntry[];
    source: GrantSource;
}

export interface EvaluatedClass extends ClassValues {
    hitDie: number;
    // What the class calls its subclasses, e.g. "Martial Archetype"
    subclassTitle: string;
    subclassLevel: number;
    // Whether the class level allows a subclass but none is chosen.
    subclassPending: boolean;
    subclasses: ChoiceEntry[];
}

export interface HitDice {
    die: number;
    count: number;
}

export interface EvaluatedSpellcasting {
    classId: CompendiumId<"class">;
    className: string;
    ability: CompendiumId<"ability">;
    preparation: SpellPreparation;
    saveDc: DiceSimplification | PendingDiceSimplification;
    attackBonus: DiceSimplification | PendingDiceSimplification;
    // Dice expression reference to the attack bonus, resolving against the character's shape.
    // Undefined when the spellcasting ability isn't registered.
    attackReference: string | undefined;
    // The highest spell level the class can learn or prepare, 0 before it casts spells.
    maxSpellLevel: number;
    // Limits from the class table; the stored lists can exceed them, e.g. after losing a level.
    // Undefined when the class has no such limit, or for `prepared` while the ability modifier is pending.
    limits: Record<SpellList, number | undefined>;
    // The class list, including expanded spells, up to `maxSpellLevel`
    available: CompendiumId<"spell">[];
}

// A spell a source grants: always prepared and not counted against any limit
export interface EvaluatedGrantedSpell {
    id: CompendiumId<"spell">;
    source: GrantSource;
    // Undefined when neither the source nor its class names one
    ability: CompendiumId<"ability"> | undefined;
    // The class it is cast as, for class and subclass sources
    classId?: CompendiumId<"class">;
}

export interface PactSlots {
    count: number;
    // The level every pact slot is cast at
    level: number;
}

export interface EvaluatedResource {
    id: string;
    name: string;
    max: number;
    recharge: "short" | "long";
    source: GrantSource;
}

export interface EvaluatedItem extends InventoryItem {
    // Undefined for an item outside the compendium
    data: Item | undefined;
    // In pounds, per piece
    unitWeight: number;
    // For weapons, armor and shields, undefined for other items
    proficient: boolean | undefined;
}

export interface EvaluatedAttack {
    // An equipped weapon, or an attack the player added
    kind: "weapon" | "manual";
    // Inventory item id of a weapon, `Attack.id` otherwise
    id: string;
    name: string;
    // The ability whose modifier the rolls add: the better one for a finesse weapon, undefined for none
    ability: CompendiumId<"ability"> | undefined;
    // Dice expression of the attack bonus, resolving against the character's shape, e.g. "{str} + {proficiency} + 1"
    attack: string;
    // Undefined while a modifier is pending or doesn't resolve to a number
    attackBonus: number | undefined;
    // Without modifiers, e.g. "1d8"
    damageDice: string | undefined;
    // Dice expression, undefined for an attack that deals no damage
    damage: string | undefined;
    // What the damage dice add, undefined like `attackBonus`
    damageBonus: number | undefined;
    damageType: string | undefined;
    // Two-handed damage of a versatile weapon, as a dice expression
    versatileDamage: string | undefined;
    // In feet, for ammunition and thrown weapons
    distance: { normal: number; long: number } | undefined;
    // The properties of a weapon, the tags of an attack the player added
    tags: string[];
    proficient: boolean;
}

export type EvaluatedEquipmentGrant =
    | { kind: "item"; item: CompendiumId<"item">; name: string; quantity: number }
    | { kind: "from"; options: ChoiceEntry[]; quantity: number }
    | { kind: "custom"; name: string; quantity: number }
    | { kind: "coins"; amount: number; unit: CoinUnit };

export interface EvaluatedStartingEquipment {
    source: GrantSource;
    // Whether it was added to the inventory
    added: boolean;
    lines: { text: string; options: EvaluatedEquipmentGrant[][] }[];
}

// For one line of starting equipment: the index of the picked option, and the item picked for each `from` grant of
// that option, in order
export interface StartingEquipmentPick {
    option: number;
    from: CompendiumId<"item">[];
}

export interface EvaluatedCharacter extends Character5e {
    classes: EvaluatedClass[];
    proficiencyBonus: DiceSimplification | PendingDiceSimplification;
    hitPointMax: DiceSimplification | PendingDiceSimplification;
    // From the equipped armor and shield, or the best unarmored defense, plus `armorClassBonus`
    armorClass: DiceSimplification | PendingDiceSimplification;
    // Dice expression reference to the armor class
    armorClassReference: string;
    initiative: DiceSimplification | PendingDiceSimplification;
    // Dice expression reference to the initiative modifier, undefined when Dexterity isn't registered
    initiativeReference: string | undefined;
    // The inventory with the compendium data of each item
    items: EvaluatedItem[];
    // The equipped weapons, then the attacks the player added
    attacks: EvaluatedAttack[];
    // In pounds, coins included at 50 to the pound
    carriedWeight: number;
    // In pounds, undefined while the Strength score isn't registered
    carryingCapacity: number | undefined;
    // Of the starting class and the background
    startingEquipment: EvaluatedStartingEquipment[];
    // One entry per die size, largest first
    hitDice: HitDice[];
    // Classes with spellcasting, in class order
    spellcasting: EvaluatedSpellcasting[];
    grantedSpells: EvaluatedGrantedSpell[];
    // Slots per spell level, 1st to 9th, from every class but warlock
    spellSlots: number[];
    pactSlots: PactSlots | undefined;
    resources: EvaluatedResource[];
    abilities: Record<CompendiumId<"ability">, EvaluatedAbility>;
    skills: Record<CompendiumId<"skill">, EvaluatedSkill>;
    // Every language the character knows, own or granted.
    knownLanguages: EvaluatedLanguage[];
    armor: EvaluatedGrantItem[];
    weapons: EvaluatedGrantItem[];
    tools: EvaluatedGrantItem[];
    // Traits and features of the current sources, including the picked options of option choices.
    traits: EvaluatedTrait[];
    // Choices of the current sources, including completed ones. Pending when `picked` is shorter than `count`.
    choices: EvaluatedChoice[];
    // Whether the race has subraces in the compendium but none is chosen.
    subracePending: boolean;
    speed: SourcedValue<number> | undefined;
    size: SourcedValue<string> | undefined;
    darkvision: SourcedValue<number> | undefined;
}

// The build (classes, race, background, choices, spells, characteristics and details), the play state and the
// inventory are kept in three shape DataBlocks of the SRD mod that only users with edit access to the shape can read
// or write. Each is saved as a whole, so separate blocks keep e.g. a hit point change from overwriting an inventory
// change made at the same time. Custom data only holds the values that formulas and rolls use, such as scores,
// modifiers, proficiencies, levels, hit point maximum, armor class and initiative.
// Setters do nothing while the blocks are loading.
export interface CharacterService {
    readonly schemaVersion: number;
    // The custom data fields every character has, given the abilities and skills currently registered in the
    // compendium. Class levels and spell formulas are added for the classes the character has.
    describe(): CharacterField[];
    // A snapshot of the stored values. Starts loading the build, undefined until it has loaded.
    read(shape: LocalId): Character5e | undefined;
    // Reactive view with evaluated modifiers, to be called in a component setup or another effect scope.
    // Holds a custom data lease on the shape, creates missing fields whenever the shape changes and is
    // undefined until the build has loaded.
    useCharacter(shape: MaybeRefOrGetter<LocalId | null | undefined>): Readonly<Ref<EvaluatedCharacter | undefined>>;
    // Creates missing fields with their defaults, starts loading the build and brings the values the service
    // maintains, such as ability increases, levels and hit point base, in line with it. Safe to call repeatedly.
    ensure(shape: LocalId): void;
    // Level 0 removes the class. The first class added becomes the starting class.
    // Raises the skills, saves and expertise that newly reached levels grant.
    setClassLevel(shape: LocalId, classId: CompendiumId<"class">, level: number): void;
    // A subclass id or name of the class. Empty clears it.
    setSubclass(shape: LocalId, classId: CompendiumId<"class">, subclass: string): void;
    setStartingClass(shape: LocalId, classId: CompendiumId<"class">): void;
    setHitPointBonus(shape: LocalId, bonus: number): void;
    // The base score, without increases from grants
    setAbilityScore(shape: LocalId, ability: CompendiumId<"ability">, score: number): void;
    setSaveProficiency(shape: LocalId, ability: CompendiumId<"ability">, proficiency: number): void;
    setSkillProficiency(shape: LocalId, skill: CompendiumId<"skill">, proficiency: number): void;
    // A compendium id or name, or free text for a background outside the compendium. Empty clears it.
    // Raises the skills the background grants to proficient, including earlier picks for its choices.
    setBackground(shape: LocalId, background: string): void;
    // A race or subrace id or name, or free text for a race outside the compendium. Empty clears both.
    // A subrace also sets its race. Raises granted skills like `setBackground`.
    setRace(shape: LocalId, race: string): void;
    // A subrace of the current race. Empty clears it.
    setSubrace(shape: LocalId, subrace: string): void;
    // Picks for a choice of one of the current sources. Invalid and excess picks are dropped,
    // newly picked skills are raised to proficient.
    setChoice(shape: LocalId, source: Pick<GrantSource, "kind" | "id">, choice: string, picks: readonly string[]): void;
    // Spell ids or names for a list of a spellcasting class. Spells the list can't hold are dropped: cantrips must
    // be cantrips and other spells levelled, both from the class list, and prepared spellbook spells must be known.
    // Limits are not enforced.
    setSpells(shape: LocalId, classId: CompendiumId<"class">, list: SpellList, spells: readonly string[]): void;
    // The languages known through the player's own choice
    setLanguages(shape: LocalId, languages: readonly string[]): void;
    setCharacteristic(shape: LocalId, characteristic: Characteristic, text: string): void;
    setAlignment(shape: LocalId, alignment: string): void;
    setDetails(shape: LocalId, details: Partial<CharacterDetails>): void;
    setState(shape: LocalId, state: Partial<CharacterState>): void;
    setArmorClassBonus(shape: LocalId, bonus: number): void;
    setInitiativeBonus(shape: LocalId, bonus: number): void;
    // A compendium item stacks onto an unequipped piece of it without bonus or notes. A pack adds its contents.
    addItem(shape: LocalId, item: NewItem): void;
    // An item stays at quantity 0, only `removeItem` removes it
    updateItem(shape: LocalId, id: string, change: Partial<Omit<InventoryItem, "id" | "item">>): void;
    removeItem(shape: LocalId, id: string): void;
    setCoins(shape: LocalId, coins: Partial<Coins>): void;
    // One pick per line of the source's starting equipment, see `EvaluatedCharacter.startingEquipment`.
    // Does nothing once the source's starting equipment was added, or when a pick is invalid.
    addStartingEquipment(
        shape: LocalId,
        source: Pick<GrantSource, "kind" | "id">,
        picks: readonly StartingEquipmentPick[],
    ): void;
}
