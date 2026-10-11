import type { DiceSimplification, LocalId, PendingDiceSimplification } from "@planarally/mod-api";
import type {
    Ability,
    AbilityIncreaseSource,
    Background,
    CharacterClass,
    CharacterService,
    Characteristic,
    Characteristics,
    Coins,
    CompendiumId,
    CompendiumRef,
    EvaluatedAttack,
    EvaluatedCharacter,
    EvaluatedChoice,
    EvaluatedClass,
    EvaluatedGrantedSpell,
    EvaluatedGrantItem,
    EvaluatedItem,
    EvaluatedResource,
    EvaluatedSpellcasting,
    EvaluatedStartingEquipment,
    EvaluatedTrait,
    GrantSource,
    HitDice,
    InventoryItem,
    Item,
    Language,
    NewItem,
    PactSlots,
    Race,
    Skill,
    SourcedValue,
    Spell,
    SpellList,
    SrdModApi,
    SrdModTag,
    StartingEquipmentPick,
    Subrace,
    WeaponPropertyRule,
} from "@planarally/system-dnd-5e-srd";
import { computed, effectScope, onScopeDispose, reactive, shallowRef, watch, type Ref } from "vue";

import { api, openedCharacterSheet } from "../context";

import { createEmptyCharacter, type Character, type DerivedStats } from "./sheet";

const SYSTEM = "dnd-5e";
const SRD_MOD: SrdModTag = "srd-5-1";
const SAVE_DELAY = 500;

export interface SheetAbility {
    // E.g. "strength"
    id: CompendiumId<"ability">;
    name: string;
    // Lowercase, e.g. "str"
    abbreviation: string;
    // The base score, without increases
    score: number;
    increase: number;
    increases: AbilityIncreaseSource[];
    modifier: DiceSimplification | PendingDiceSimplification;
    // Multiplier for the proficiency bonus: 0 is not proficient, 1 is proficient
    saveProficiency: number;
    save: DiceSimplification | PendingDiceSimplification;
    saveSources: GrantSource[];
    modifierReference: string;
    saveReference: string;
}

export interface SheetSkill {
    // E.g. "sleight-of-hand"
    id: CompendiumId<"skill">;
    name: string;
    // Lowercase abbreviation of the skill's ability, e.g. "dex"
    ability: string;
    // Multiplier for the proficiency bonus: 0 is not proficient, 0.5 half, 1 proficient, 2 expertise
    proficiency: number;
    modifier: DiceSimplification | PendingDiceSimplification;
    sources: GrantSource[];
    expertiseSources: GrantSource[];
    modifierReference: string;
}

export interface SheetOption {
    // Compendium id, or the stored text for an entry outside the compendium
    id: string;
    name: string;
}

export interface SheetBackground {
    // Undefined for a background outside the compendium
    id: CompendiumId<"background"> | undefined;
    name: string;
    data: Background | undefined;
}

export interface SheetRace {
    // Undefined for a race outside the compendium
    id: CompendiumId<"race"> | undefined;
    name: string;
    subraceId: CompendiumId<"subrace"> | undefined;
    subraceName: string;
    // The subraces of the current race
    subraces: SheetOption[];
    subracePending: boolean;
}

export interface SheetLanguage extends SheetOption {
    own: boolean;
    sources: GrantSource[];
}

export type SheetChoice = EvaluatedChoice;

export type SheetClass = EvaluatedClass;

export interface SheetSpell {
    id: CompendiumId<"spell">;
    name: string;
    // Markdown, starting with the level line and the casting stats
    body: string;
    data: Spell;
}

export interface SheetSpellcasting extends EvaluatedSpellcasting {
    // The class's own lists
    spells: Record<SpellList, CompendiumId<"spell">[]>;
}

export interface SheetStats {
    // The starting class first
    classes: SheetClass[];
    allClasses: SheetOption[];
    // Of the starting class and the background
    startingEquipment: EvaluatedStartingEquipment[];
    level: number;
    proficiencyBonus: number;
    // Undefined while the formula is pending or does not resolve to a number
    hitPointMax: number | undefined;
    hitPointBonus: number;
    hitDice: HitDice[];
    spellcasting: SheetSpellcasting[];
    grantedSpells: EvaluatedGrantedSpell[];
    // Slots per spell level, 1st to 9th
    spellSlots: number[];
    pactSlots: PactSlots | undefined;
    resources: EvaluatedResource[];
    // Every spell in the compendium
    spells: ReadonlyMap<CompendiumId<"spell">, SheetSpell>;
    abilities: SheetAbility[];
    skills: SheetSkill[];
    race: SheetRace;
    races: SheetOption[];
    speed: SourcedValue<number> | undefined;
    size: SourcedValue<string> | undefined;
    darkvision: SourcedValue<number> | undefined;
    background: SheetBackground;
    backgrounds: SheetOption[];
    alignment: string;
    // Known languages, own or granted
    languages: SheetLanguage[];
    allLanguages: SheetOption[];
    armor: EvaluatedGrantItem[];
    weapons: EvaluatedGrantItem[];
    tools: EvaluatedGrantItem[];
    traits: EvaluatedTrait[];
    choices: SheetChoice[];
    characteristics: Characteristics;
    // Undefined when Dexterity isn't registered
    initiativeReference: string | undefined;
    // Without the stored bonus, undefined while the formula is pending or doesn't resolve to a number
    armorClassBase: number | undefined;
    // What the armor class comes from, e.g. ["Chain mail 16", "Shield +2"]
    armorClassParts: string[];
    items: EvaluatedItem[];
    // Every item in the compendium, by name
    itemOptions: SheetOption[];
    itemRefs: ReadonlyMap<CompendiumId<"item">, CompendiumRef>;
    // The weapon property rules by property, e.g. "finesse", including "range"
    propertyRefs: ReadonlyMap<string, CompendiumRef>;
    coins: Coins;
    // The equipped weapons, then the attacks the player added
    attacks: EvaluatedAttack[];
    // In pounds
    carriedWeight: number;
    carryingCapacity: number | undefined;
    // The stored values of what the pages edit
    character: Character;
}

export function isPending(choice: SheetChoice): boolean {
    return choice.picked.length < Math.min(choice.count, choice.options.length);
}

export function sourceText(sources: readonly GrantSource[]): string | undefined {
    if (sources.length === 0) return undefined;
    return `From ${sources.map((source) => source.name).join(", ")}`;
}

function optionsOf(records: readonly { id: string; name: string }[]): SheetOption[] {
    return records.map((record) => ({ id: record.id, name: record.name }));
}

function named(options: readonly SheetOption[], id: string): SheetOption {
    return options.find((option) => option.id === id) ?? { id, name: id };
}

function spellIndex(): Map<CompendiumId<"spell">, SheetSpell> {
    const spells = new Map<CompendiumId<"spell">, SheetSpell>();
    for (const { id, name, body, schema } of api.compendium.getEntries<Spell>(SYSTEM, "spell")) {
        if (schema.data !== undefined) spells.set(id, { id, name, body: body ?? "", data: schema.data });
    }
    return spells;
}

// Reactive: follows the SRD mod loading, unloading and reloading
export function characterService(): CharacterService | undefined {
    return api.getModApi<SrdModApi>(SRD_MOD)?.character;
}

// Starts over with every new service, so an open sheet survives the SRD mod reloading
export function useOpenedCharacter(): Readonly<Ref<EvaluatedCharacter | undefined>> {
    const character = shallowRef<Readonly<Ref<EvaluatedCharacter | undefined>>>();
    watch(
        characterService,
        (service, _, onCleanup) => {
            const scope = effectScope();
            character.value = scope.run(() => service?.useCharacter(openedCharacterSheet));
            onCleanup(() => scope.stop());
        },
        { immediate: true },
    );
    return computed(() => character.value?.value);
}

// Undefined while the SRD mod is inactive, no sheet is open or the character's build is loading.
export function useOpenedStats(): Readonly<Ref<SheetStats | undefined>> {
    const character = useOpenedCharacter();
    return computed(() => {
        const value = character.value;
        if (value === undefined) return undefined;
        const abilityList: SheetAbility[] = [];
        for (const record of api.compendium.getEntries<Ability>(SYSTEM, "ability")) {
            const values = value.abilities[record.id];
            const abbreviation = record.schema.data?.abbreviation;
            if (values === undefined || abbreviation === undefined) continue;
            abilityList.push({
                id: record.id,
                name: record.name,
                abbreviation: abbreviation.toLowerCase(),
                ...values,
            });
        }
        const skillList: SheetSkill[] = [];
        for (const record of api.compendium.getEntries<Skill>(SYSTEM, "skill")) {
            const values = value.skills[record.id];
            const ability = abilityList.find((ability) => ability.id === record.schema.data?.ability);
            if (values === undefined || ability === undefined) continue;
            skillList.push({ id: record.id, name: record.name, ability: ability.abbreviation, ...values });
        }
        const classRecords = api.compendium.getEntries<CharacterClass>(SYSTEM, "class");
        const itemRecords = api.compendium.getEntries<Item>(SYSTEM, "item");
        const backgroundRecords = api.compendium.getEntries<Background>(SYSTEM, "background");
        const allLanguages = optionsOf(api.compendium.getEntries<Language>(SYSTEM, "language"));
        const subraces = api.compendium
            .getEntries<Subrace>(SYSTEM, "subrace")
            .filter((subrace) => value.race.id !== undefined && subrace.schema.data?.race === value.race.id);
        return {
            classes: value.classes,
            allClasses: optionsOf(classRecords),
            startingEquipment: value.startingEquipment,
            level: value.level,
            proficiencyBonus: value.proficiencyBonus.kind === "number" ? value.proficiencyBonus.value : 2,
            hitPointMax: value.hitPointMax.kind === "number" ? value.hitPointMax.value : undefined,
            hitPointBonus: value.hitPointBonus,
            hitDice: value.hitDice,
            spellcasting: value.spellcasting.map((casting) => ({
                ...casting,
                spells: value.classes.find((values) => values.id === casting.classId)?.spells ?? {
                    cantrips: [],
                    known: [],
                    prepared: [],
                },
            })),
            grantedSpells: value.grantedSpells,
            spellSlots: value.spellSlots,
            pactSlots: value.pactSlots,
            resources: value.resources,
            spells: spellIndex(),
            abilities: abilityList,
            skills: skillList,
            race: {
                id: value.race.id,
                name: value.race.name,
                subraceId: value.subrace.id,
                subraceName: value.subrace.name,
                subraces: optionsOf(subraces),
                subracePending: value.subracePending,
            },
            races: optionsOf(api.compendium.getEntries<Race>(SYSTEM, "race")),
            speed: value.speed,
            size: value.size,
            darkvision: value.darkvision,
            background: {
                ...value.background,
                data: backgroundRecords.find((record) => record.id === value.background.id)?.schema.data,
            },
            backgrounds: optionsOf(backgroundRecords),
            alignment: value.alignment,
            languages: value.knownLanguages.map((language) => ({ ...named(allLanguages, language.id), ...language })),
            allLanguages,
            armor: value.armor,
            weapons: value.weapons,
            tools: value.tools,
            traits: value.traits,
            choices: value.choices,
            characteristics: value.characteristics,
            initiativeReference: value.initiativeReference,
            armorClassBase:
                value.armorClass.kind === "number" ? value.armorClass.value - value.armorClassBonus : undefined,
            armorClassParts: armorClassParts(value.items),
            items: value.items,
            itemOptions: optionsOf(itemRecords).sort((a, b) => a.name.localeCompare(b.name)),
            itemRefs: new Map(itemRecords.map((record) => [record.id, `${record.mod}/${record.id}`])),
            propertyRefs: new Map(
                api.compendium
                    .getEntries<WeaponPropertyRule>(SYSTEM, "weapon-property")
                    .flatMap((record) =>
                        record.schema.data === undefined
                            ? []
                            : [[record.schema.data.property, `${record.mod}/${record.id}`] as const],
                    ),
            ),
            coins: value.inventory.coins,
            attacks: value.attacks,
            carriedWeight: value.carriedWeight,
            carryingCapacity: value.carryingCapacity,
            character: sheetCharacter(value),
        };
    });
}

function bonusText(bonus: number): string {
    return bonus === 0 ? "" : ` ${bonus > 0 ? "+" : ""}${bonus}`;
}

// The first equipped armor and shield count, like in the SRD character
function armorClassParts(items: readonly EvaluatedItem[]): string[] {
    const worn = items.filter((item) => item.equipped && item.data?.type === "armor");
    const armor = worn.find((item) => item.data?.type === "armor" && item.data.category !== "shield");
    const shield = worn.find((item) => item.data?.type === "armor" && item.data.category === "shield");
    const parts = [armor === undefined ? "Unarmored" : `${armor.name}${bonusText(armor.bonus)}`];
    if (shield !== undefined) parts.push(`${shield.name}${bonusText(shield.bonus)}`);
    return parts;
}

function sheetCharacter(value: EvaluatedCharacter): Character {
    const { details, state } = value;
    return {
        ...details,
        inspiration: state.inspiration,
        armorClassBonus: value.armorClassBonus,
        initiativeBonus: value.initiativeBonus,
        hp: state.hitPoints,
        hitDice: { spent: state.spentHitDice },
        deathSaves: state.deathSaves,
        spentSlots: state.spentSlots,
        spentPactSlots: state.spentPactSlots,
        spentResources: state.spentResources,
    };
}

function definedOnly<T extends object>(values: T): Partial<T> {
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function saveSheetCharacter(shape: LocalId, changes: Partial<Character>): void {
    const service = characterService();
    if (service === undefined) return;
    const {
        inspiration,
        armorClassBonus,
        initiativeBonus,
        hp,
        hitDice,
        deathSaves,
        spentSlots,
        spentPactSlots,
        spentResources,
        ...details
    } = changes;
    const state = definedOnly({
        hitPoints: hp,
        spentHitDice: hitDice?.spent,
        deathSaves,
        inspiration,
        spentSlots,
        spentPactSlots,
        spentResources,
    });
    if (Object.keys(details).length > 0) service.setDetails(shape, details);
    if (Object.keys(state).length > 0) service.setState(shape, state);
    if (armorClassBonus !== undefined) service.setArmorClassBonus(shape, armorClassBonus);
    if (initiativeBonus !== undefined) service.setInitiativeBonus(shape, initiativeBonus);
}

function sortedKeys(_: string, value: unknown): unknown {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

function sameJson(a: unknown, b: unknown): boolean {
    return JSON.stringify(a, sortedKeys) === JSON.stringify(b, sortedKeys);
}

function cloneCharacter(character: Character): Character {
    return JSON.parse(JSON.stringify(character)) as Character;
}

function fieldsOf(character: Character): (keyof Character)[] {
    return Object.keys(character) as (keyof Character)[];
}

// The pages edit the returned object in place. Edits are saved to the opened character after a pause, sending only
// the fields that changed, so they don't overwrite what another user changed in the meantime. Stored changes replace
// the fields that have no edit waiting to be saved.
export function useOpenedSheetCharacter(stats: Readonly<Ref<SheetStats | undefined>>): Character {
    const character = reactive(createEmptyCharacter());
    // The stored values the edits are made on
    let base = createEmptyCharacter();
    let pending: { shape: LocalId; timer: ReturnType<typeof setTimeout> } | undefined;

    function save(): void {
        if (pending === undefined) return;
        clearTimeout(pending.timer);
        const { shape } = pending;
        pending = undefined;
        const changes = fieldsOf(character).filter((field) => !sameJson(character[field], base[field]));
        base = cloneCharacter(character);
        saveSheetCharacter(shape, Object.fromEntries(changes.map((field) => [field, character[field]])));
    }

    // Sync, so edits reach the previous character before the object is replaced with the next one
    watch(openedCharacterSheet, save, { flush: "sync" });
    watch(
        () => stats.value?.character,
        (stored) => {
            if (stored === undefined) return;
            // A copy of its own, as edits to the character's objects and arrays must not reach the base
            const next = cloneCharacter(stored);
            const unedited = fieldsOf(next).filter((field) => sameJson(character[field], base[field]));
            base = cloneCharacter(stored);
            Object.assign(character, Object.fromEntries(unedited.map((field) => [field, next[field]])));
        },
        { immediate: true },
    );
    watch(
        character,
        () => {
            if (pending !== undefined) clearTimeout(pending.timer);
            pending = undefined;
            const shape = openedCharacterSheet.value;
            if (shape === null || sameJson(base, character)) return;
            pending = { shape, timer: setTimeout(save, SAVE_DELAY) };
        },
        { deep: true },
    );
    onScopeDispose(save);
    return character;
}

// Modifiers that did not resolve to a number, e.g. a custom formula with dice, count as 0.
export function derivedStats(stats: SheetStats | undefined): DerivedStats {
    const modifiers: Record<string, number> = {};
    for (const ability of stats?.abilities ?? []) {
        if (ability.modifier.kind === "number") modifiers[ability.abbreviation] = ability.modifier.value;
    }
    const skills: Record<string, number> = {};
    for (const skill of stats?.skills ?? []) {
        if (skill.modifier.kind === "number") skills[skill.id] = skill.modifier.value;
    }
    return { proficiency: stats?.proficiencyBonus ?? 0, modifiers, skills };
}

export function setOpenedClassLevel(classId: CompendiumId<"class">, level: number): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setClassLevel(shape, classId, level);
}

export function setOpenedSubclass(classId: CompendiumId<"class">, subclass: string): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setSubclass(shape, classId, subclass);
}

export function setOpenedStartingClass(classId: CompendiumId<"class">): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setStartingClass(shape, classId);
}

export function setOpenedHitPointBonus(bonus: number): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setHitPointBonus(shape, bonus);
}

export function setOpenedAbilityScore(ability: CompendiumId<"ability">, score: number): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setAbilityScore(shape, ability, score);
}

export function setOpenedSaveProficiency(ability: CompendiumId<"ability">, proficiency: number): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setSaveProficiency(shape, ability, proficiency);
}

export function setOpenedSkillProficiency(skill: CompendiumId<"skill">, proficiency: number): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setSkillProficiency(shape, skill, proficiency);
}

export function setOpenedBackground(background: string): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setBackground(shape, background);
}

export function setOpenedRace(race: string): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setRace(shape, race);
}

export function setOpenedSubrace(subrace: string): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setSubrace(shape, subrace);
}

export function setOpenedChoice(choice: SheetChoice, picks: readonly string[]): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setChoice(shape, choice.source, choice.id, picks);
}

export function setOpenedSpells(classId: CompendiumId<"class">, list: SpellList, spells: readonly string[]): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setSpells(shape, classId, list, spells);
}

export function setOpenedLanguages(languages: readonly string[]): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setLanguages(shape, languages);
}

export function setOpenedAlignment(alignment: string): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setAlignment(shape, alignment);
}

export function setOpenedCharacteristic(characteristic: Characteristic, text: string): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setCharacteristic(shape, characteristic, text);
}

export function addOpenedItem(item: NewItem): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.addItem(shape, item);
}

export function updateOpenedItem(id: string, change: Partial<Omit<InventoryItem, "id" | "item">>): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.updateItem(shape, id, change);
}

export function removeOpenedItem(id: string): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.removeItem(shape, id);
}

export function setOpenedCoins(coins: Partial<Coins>): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.setCoins(shape, coins);
}

export function addOpenedStartingEquipment(source: GrantSource, picks: readonly StartingEquipmentPick[]): void {
    const shape = openedCharacterSheet.value;
    if (shape !== null) characterService()?.addStartingEquipment(shape, source, picks);
}
