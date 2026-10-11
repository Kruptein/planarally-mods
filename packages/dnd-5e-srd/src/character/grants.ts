import type { CompendiumRecord } from "@planarally/mod-api";

import type { Background } from "../types/background.ts";
import type {
    AbilityIncreaseSource,
    Character5e,
    ChoiceEntry,
    EvaluatedChoice,
    EvaluatedGrantedSpell,
    EvaluatedTrait,
    GrantSource,
    SourcedValue,
} from "../types/character.ts";
import type { Subclass } from "../types/class.ts";
import type { CompendiumId, CompendiumKind } from "../types/compendium.ts";
import type { Grant, Grants, SpellChoice, Trait, UnarmoredDefense } from "../types/grants.ts";
import type { Item } from "../types/item.ts";
import type { Race, Subrace } from "../types/race.ts";
import type { Spell } from "../types/spell.ts";

import { ARMOR_GROUPS, WEAPON_GROUPS } from "./items.ts";
import type { AbilityInfo, ClassInfo, SkillInfo } from "./schema.ts";

export interface Named {
    id: string;
    name: string;
}

// The entry whose id or name matches, case-insensitively
export function findEntry<T extends Named>(entries: readonly T[], text: string): T | undefined {
    const key = text.trim().toLowerCase();
    if (key.length === 0) return undefined;
    return entries.find((entry) => entry.id.toLowerCase() === key || entry.name.toLowerCase() === key);
}

// Ids where an entry matches, the text itself otherwise, without duplicates
export function resolveIds(entries: readonly Named[], items: readonly string[]): string[] {
    return [...new Set(items.map((item) => findEntry(entries, item)?.id ?? item.trim()))].filter((id) => id.length > 0);
}

// Everything registered in the compendium that a character can refer to
export interface Catalog {
    abilities: readonly AbilityInfo[];
    skills: readonly SkillInfo[];
    languages: readonly Named[];
    backgrounds: readonly CompendiumRecord<Background>[];
    races: readonly CompendiumRecord<Race>[];
    subraces: readonly CompendiumRecord<Subrace>[];
    classes: readonly ClassInfo[];
    subclasses: readonly CompendiumRecord<Subclass>[];
    spells: readonly CompendiumRecord<Spell>[];
    items: readonly CompendiumRecord<Item>[];
}

// Names for armor, weapon and tool proficiencies: the groups and the items
export function proficiencyNames(catalog: Catalog): readonly Named[] {
    return [...ARMOR_GROUPS, ...WEAPON_GROUPS, ...catalog.items];
}

export function subracesOf(catalog: Catalog, raceId: CompendiumId<"race">): CompendiumRecord<Subrace>[] {
    return catalog.subraces.filter((subrace) => subrace.schema.data?.race === raceId);
}

export function subclassesOf(catalog: Catalog, classId: CompendiumId<"class">): CompendiumRecord<Subclass>[] {
    return catalog.subclasses.filter((subclass) => subclass.schema.data?.class === classId);
}

// A class as stored: its id, level and subclass text. The starting class comes first.
export interface ClassSelection {
    id: CompendiumId<"class">;
    level: number;
    subclass: string;
}

export interface ActiveClass {
    info: ClassInfo;
    level: number;
    starting: boolean;
    // Only set when it belongs to the class
    subclass: CompendiumRecord<Subclass> | undefined;
}

export interface ActiveSources {
    background: CompendiumRecord<Background> | undefined;
    race: CompendiumRecord<Race> | undefined;
    // Only set when it belongs to `race`
    subrace: CompendiumRecord<Subrace> | undefined;
    classes: ActiveClass[];
}

// From stored text, which can be an id or a name
export function resolveSources(
    catalog: Catalog,
    background: string,
    race: string,
    subrace: string,
    classes: readonly ClassSelection[],
): ActiveSources {
    const raceRecord = findEntry(catalog.races, race);
    const active: ActiveClass[] = [];
    for (const selection of classes) {
        const info = catalog.classes.find((info) => info.id === selection.id);
        if (info === undefined || selection.level < 1) continue;
        active.push({
            info,
            level: selection.level,
            starting: active.length === 0,
            subclass: findEntry(subclassesOf(catalog, info.id), selection.subclass),
        });
    }
    return {
        background: findEntry(catalog.backgrounds, background),
        race: raceRecord,
        subrace: raceRecord === undefined ? undefined : findEntry(subracesOf(catalog, raceRecord.id), subrace),
        classes: active,
    };
}

export function activeSources(catalog: Catalog, character: Character5e): ActiveSources {
    return resolveSources(
        catalog,
        character.background.id ?? "",
        character.race.id ?? "",
        character.subrace.id ?? "",
        character.classes.map((values) => ({ id: values.id, level: values.level, subclass: values.subclass.id ?? "" })),
    );
}

// A source with its grants, normalised across backgrounds, races, classes and their variants
export interface SourceEntry {
    // Unique among the entries, so a newly reached class level or a changed source shows up as a new key
    key: string;
    source: GrantSource;
    grants: Grants;
    traits: readonly Trait[];
    // The class level a class or subclass entry is gained at
    level?: number;
    // The class of a class or subclass entry
    classId?: CompendiumId<"class">;
    // What levelled spells compare against: the class level for class and subclass entries, the character level otherwise
    sourceLevel: number;
    speed?: number;
    size?: string;
    darkvision?: number;
}

function sourceOf(kind: GrantSource["kind"], record: Named): GrantSource {
    return { kind, id: record.id, name: record.name };
}

function classEntries(active: ActiveClass): SourceEntry[] {
    const { info, level, starting, subclass } = active;
    const source = sourceOf("class", info);
    const classId = info.id;
    const entries: SourceEntry[] = [
        {
            key: `class:${info.id}:${starting ? "starting" : "multiclass"}`,
            source,
            grants: starting ? info.data : (info.data.multiclass ?? {}),
            traits: [],
            classId,
            sourceLevel: level,
        },
    ];
    info.data.levels.forEach((entry, index) => {
        if (entry.level > level) return;
        entries.push({
            key: `class:${info.id}:${index}`,
            source,
            grants: entry.grants ?? {},
            traits: entry.features ?? [],
            level: entry.level,
            classId,
            sourceLevel: level,
        });
    });
    const data = subclass?.schema.data;
    if (subclass === undefined || data === undefined || level < info.data.subclassLevel) return entries;
    const subclassSource = sourceOf("subclass", subclass);
    data.levels.forEach((entry, index) => {
        if (entry.level > level) return;
        entries.push({
            key: `subclass:${subclass.id}:${index}`,
            source: subclassSource,
            grants: entry.grants ?? {},
            traits: entry.features ?? [],
            level: entry.level,
            classId,
            sourceLevel: level,
        });
    });
    return entries;
}

// Race first, so its traits come before those of the subrace, background and classes
export function sourceEntries(active: ActiveSources): SourceEntry[] {
    const entries: SourceEntry[] = [];
    const sourceLevel = active.classes.reduce((sum, activeClass) => sum + activeClass.level, 0);
    for (const [kind, record] of [
        ["race", active.race],
        ["subrace", active.subrace],
    ] as const) {
        const data = record?.schema.data;
        if (record === undefined || data === undefined) continue;
        entries.push({
            key: `${kind}:${record.id}`,
            source: sourceOf(kind, record),
            grants: data,
            traits: data.traits ?? [],
            sourceLevel,
            speed: data.speed,
            size: data.size,
            darkvision: data.darkvision,
        });
    }
    const background = active.background;
    const data = background?.schema.data;
    if (background !== undefined && data !== undefined) {
        entries.push({
            key: `background:${background.id}`,
            source: sourceOf("background", background),
            grants: data,
            traits: data.feature === undefined ? [] : [data.feature],
            sourceLevel,
        });
    }
    for (const activeClass of active.classes) entries.push(...classEntries(activeClass));
    return entries;
}

// The picks stored for the choices of a source
export function picksOf(character: Character5e, source: GrantSource): Record<string, string[]> {
    switch (source.kind) {
        case "class":
            return character.classes.find((values) => values.id === source.id)?.choices ?? {};
        case "subclass":
            return character.classes.find((values) => values.subclass.id === source.id)?.subclass.choices ?? {};
        default:
            return character[source.kind].choices;
    }
}

export type ResolvedChoice = Omit<EvaluatedChoice, "picked">;

const LIST_KINDS = [
    ["skills", "skill"],
    ["expertise", "expertise"],
    ["languages", "language"],
    ["armor", "armor"],
    ["weapons", "weapon"],
    ["tools", "tool"],
] as const;

type ListKind = (typeof LIST_KINDS)[number][1];

function optionEntries(from: readonly string[] | undefined, all: readonly Named[]): ChoiceEntry[] {
    if (from === undefined) return all.map((entry) => ({ id: entry.id, name: entry.name }));
    return from.map((id) => ({ id, name: all.find((entry) => entry.id === id)?.name ?? id }));
}

function compendiumOf(catalog: Catalog, kind: ListKind): readonly Named[] {
    if (kind === "skill" || kind === "expertise") return catalog.skills;
    if (kind === "language") return catalog.languages;
    return proficiencyNames(catalog);
}

export function choicesOf(entry: SourceEntry, catalog: Catalog): ResolvedChoice[] {
    const { source, grants } = entry;
    const choices: ResolvedChoice[] = [];
    for (const increase of grants.abilityIncreases ?? []) {
        if (!("id" in increase)) continue;
        choices.push({
            id: increase.id,
            kind: "ability",
            count: increase.count,
            amount: increase.amount,
            repeat: increase.repeat,
            options: optionEntries(increase.from, catalog.abilities),
            source,
        });
    }
    for (const [key, kind] of LIST_KINDS) {
        for (const grant of grants[key] ?? []) {
            if (typeof grant === "string") continue;
            choices.push({
                id: grant.id,
                kind,
                count: grant.count,
                options: optionEntries(grant.from, compendiumOf(catalog, kind)),
                source,
            });
        }
    }
    for (const option of grants.options ?? []) {
        choices.push({
            id: option.id,
            kind: "option",
            name: option.name,
            count: 1,
            options: option.options.map(({ id, name, description }) => ({ id, name, description })),
            source,
        });
    }
    for (const grant of grants.spells ?? []) {
        if (typeof grant === "string" || !("id" in grant)) continue;
        choices.push({
            id: grant.id,
            kind: "spell",
            count: grant.count,
            options: spellOptions(catalog, grant),
            source,
        });
    }
    return choices;
}

function spellOptions(catalog: Catalog, choice: SpellChoice): ChoiceEntry[] {
    const allowed = choice.from === undefined ? undefined : new Set(choice.from);
    return catalog.spells
        .filter((spell) => {
            const data = spell.schema.data;
            if (data === undefined || (allowed !== undefined && !allowed.has(spell.id))) return false;
            if (choice.list !== undefined && !data.classes.includes(choice.list)) return false;
            return choice.level === undefined || data.level === choice.level;
        })
        .map(({ id, name }) => ({ id, name }));
}

// The grants of the options picked for the option choices of an entry
export function pickedOptionGrants(entry: SourceEntry, picks: Record<string, string[]>): Grants[] {
    return (entry.grants.options ?? []).flatMap((option) =>
        option.options.flatMap((choice) =>
            choice.grants !== undefined && (picks[option.id] ?? []).includes(choice.id) ? [choice.grants] : [],
        ),
    );
}

// Picks matched against the options by id or name; invalid and excess picks are dropped
export function validPicks(choice: ResolvedChoice, picks: readonly string[]): string[] {
    const ids = choice.options.map((option) => option.id);
    const resolved = choice.repeat
        ? picks.map((pick) => findEntry(choice.options, pick)?.id ?? pick.trim())
        : resolveIds(choice.options, picks);
    return resolved.filter((pick) => ids.includes(pick)).slice(0, choice.count);
}

function fixed<K extends CompendiumKind>(grants: readonly Grant<K>[] | undefined): CompendiumId<K>[] {
    return (grants ?? []).filter((grant) => typeof grant === "string");
}

// What a source raises once: proficient skills and saves, and skills to expertise
export interface Raised {
    skills: CompendiumId<"skill">[];
    expertise: CompendiumId<"skill">[];
    saves: CompendiumId<"ability">[];
}

// The fixed grants of a source and its picked options, and the picks for its skill and expertise choices
export function raisedBy(entry: SourceEntry, catalog: Catalog, picks: Record<string, string[]>): Raised {
    const raised: Raised = { skills: [], expertise: [], saves: [] };
    for (const grants of [entry.grants, ...pickedOptionGrants(entry, picks)]) {
        raised.skills.push(...fixed(grants.skills));
        raised.expertise.push(...fixed(grants.expertise));
        raised.saves.push(...(grants.savingThrows ?? []));
    }
    for (const choice of choicesOf(entry, catalog)) {
        if (choice.kind === "skill") raised.skills.push(...(picks[choice.id] ?? []));
        if (choice.kind === "expertise") raised.expertise.push(...(picks[choice.id] ?? []));
    }
    return raised;
}

export interface GrantSummary {
    increases: Map<CompendiumId<"ability">, AbilityIncreaseSource[]>;
    saves: Map<CompendiumId<"ability">, GrantSource[]>;
    skills: Map<CompendiumId<"skill">, GrantSource[]>;
    expertise: Map<CompendiumId<"skill">, GrantSource[]>;
    languages: Map<string, GrantSource[]>;
    armor: Map<string, GrantSource[]>;
    weapons: Map<string, GrantSource[]>;
    tools: Map<string, GrantSource[]>;
    traits: EvaluatedTrait[];
    choices: EvaluatedChoice[];
    grantedSpells: EvaluatedGrantedSpell[];
    // Spells added to a class list
    expandedSpells: Map<CompendiumId<"class">, CompendiumId<"spell">[]>;
    unarmoredDefenses: UnarmoredDefense[];
    speed: SourcedValue<number> | undefined;
    size: SourcedValue<string> | undefined;
    darkvision: SourcedValue<number> | undefined;
}

// A source that grants the same thing at several levels is listed once
function add<T>(target: Map<string, T[]>, id: string, value: T): void {
    const current = target.get(id) ?? [];
    if (current.some((item) => JSON.stringify(item) === JSON.stringify(value))) return;
    target.set(id, [...current, value]);
}

// Every increase counts, even repeats from the same source, e.g. both halves of a +2 improvement
function addIncrease(target: Map<string, AbilityIncreaseSource[]>, id: string, source: GrantSource, amount: number) {
    target.set(id, [...(target.get(id) ?? []), { source, amount }]);
}

// Later sources replace earlier values, so a subrace overrides its race
function sourced<T>(current: SourcedValue<T> | undefined, value: T | undefined, source: GrantSource) {
    return value === undefined ? current : { value, source };
}

export function summarize(character: Character5e, catalog: Catalog): GrantSummary {
    const summary: GrantSummary = {
        increases: new Map(),
        saves: new Map(),
        skills: new Map(),
        expertise: new Map(),
        languages: new Map(),
        armor: new Map(),
        weapons: new Map(),
        tools: new Map(),
        traits: [],
        choices: [],
        grantedSpells: [],
        expandedSpells: new Map(),
        unarmoredDefenses: [],
        speed: undefined,
        size: undefined,
        darkvision: undefined,
    };
    const lists: Record<ListKind, Map<string, GrantSource[]>> = {
        skill: summary.skills,
        expertise: summary.expertise,
        language: summary.languages,
        armor: summary.armor,
        weapon: summary.weapons,
        tool: summary.tools,
    };

    const addSpell = (
        entry: SourceEntry,
        id: CompendiumId<"spell">,
        ability: CompendiumId<"ability"> | undefined,
    ): void => {
        const { source, classId } = entry;
        const known = summary.grantedSpells.some(
            (spell) => spell.id === id && JSON.stringify(spell.source) === JSON.stringify(source),
        );
        if (!known) summary.grantedSpells.push({ id, source, ability, ...(classId === undefined ? {} : { classId }) });
    };

    for (const entry of sourceEntries(activeSources(catalog, character))) {
        const { source, level, classId } = entry;
        const picks = picksOf(character, source);
        const classAbility = catalog.classes.find((info) => info.id === classId)?.data.spellcasting?.ability;
        const entryAbility = entry.grants.spellcastingAbility ?? classAbility;

        for (const grants of [entry.grants, ...pickedOptionGrants(entry, picks)]) {
            for (const increase of grants.abilityIncreases ?? []) {
                if (!("id" in increase)) addIncrease(summary.increases, increase.ability, source, increase.amount);
            }
            for (const id of grants.savingThrows ?? []) add(summary.saves, id, source);
            for (const [key, kind] of LIST_KINDS) {
                for (const id of fixed(grants[key])) add(lists[kind], id, source);
            }
            const ability = grants.spellcastingAbility ?? entryAbility;
            for (const grant of grants.spells ?? []) {
                if (typeof grant === "string") addSpell(entry, grant, ability);
                else if ("spell" in grant && grant.level <= entry.sourceLevel) addSpell(entry, grant.spell, ability);
            }
            if (grants.unarmoredDefense !== undefined) summary.unarmoredDefenses.push(grants.unarmoredDefense);
            if (classId !== undefined && grants.expandedSpells !== undefined) {
                const current = summary.expandedSpells.get(classId) ?? [];
                summary.expandedSpells.set(classId, [...new Set([...current, ...grants.expandedSpells])]);
            }
        }
        for (const trait of entry.traits) summary.traits.push({ ...trait, source, level });

        for (const choice of choicesOf(entry, catalog)) {
            const picked = (picks[choice.id] ?? []).flatMap((id) => {
                const option = choice.options.find((option) => option.id === id);
                return option === undefined ? [] : [option];
            });
            for (const option of picked) {
                if (choice.kind === "ability") {
                    addIncrease(summary.increases, option.id, source, choice.amount ?? 0);
                } else if (choice.kind === "option") {
                    summary.traits.push({
                        name: `${choice.name}: ${option.name}`,
                        description: option.description ?? "",
                        source,
                        level,
                    });
                } else if (choice.kind === "spell") {
                    addSpell(entry, option.id, entryAbility);
                } else {
                    add(lists[choice.kind], option.id, source);
                }
            }
            summary.choices.push({ ...choice, picked });
        }

        summary.speed = sourced(summary.speed, entry.speed, source);
        summary.size = sourced(summary.size, entry.size, source);
        summary.darkvision = sourced(summary.darkvision, entry.darkvision, source);
    }
    return summary;
}
