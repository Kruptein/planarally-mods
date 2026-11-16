import type {
    ApiShapeCustomData,
    DiceSimplification,
    GameApi,
    GlobalId,
    LocalId,
    PendingDiceSimplification,
    UiShapeCustomData,
} from "@planarally/mod-api";
import {
    computed,
    effectScope,
    onScopeDispose,
    shallowRef,
    toValue,
    watch,
    type EffectScope,
    type MaybeRefOrGetter,
    type Ref,
} from "vue";

import type { Ability } from "../types/ability.ts";
import type { Background } from "../types/background.ts";
import type {
    Character5e,
    ClassValues,
    EvaluatedClass,
    HitDice,
    CharacterDetails,
    CharacterField,
    Characteristic,
    CharacterService,
    CharacterState,
    DiceExpressionField,
    EvaluatedAbility,
    EvaluatedAttack,
    EvaluatedCharacter,
    EvaluatedGrantItem,
    EvaluatedItem,
    EvaluatedLanguage,
    EvaluatedResource,
    EvaluatedSkill,
    EvaluatedSpellcasting,
    GrantSource,
    InventoryItem,
    NewItem,
    NumberField,
    SourceValues,
    SpellList,
    StartingEquipmentPick,
} from "../types/character.ts";
import type { CharacterClass, Subclass } from "../types/class.ts";
import type { CompendiumKind } from "../types/compendium.ts";
import type { Coins, Item, StartingEquipment } from "../types/item.ts";
import type { Language } from "../types/language.ts";
import type { Race, Subrace } from "../types/race.ts";
import type { Skill } from "../types/skill.ts";
import type { Spell } from "../types/spell.ts";

import { cloneJson, shapeBlocks } from "./blocks.ts";
import {
    BUILD_BLOCK,
    BUILD_VERSION,
    choiceKey,
    completeBuild,
    completeInventory,
    completeState,
    emptyBuild,
    emptyInventory,
    emptySpellLists,
    emptyState,
    INVENTORY_BLOCK,
    STATE_BLOCK,
    type CharacterBuild,
    type InventoryData,
    type StateData,
} from "./build.ts";
import {
    activeSources,
    choicesOf,
    findEntry,
    pickedOptionGrants,
    picksOf,
    proficiencyNames,
    raisedBy,
    resolveIds,
    resolveSources,
    sourceEntries,
    subclassesOf,
    subracesOf,
    summarize,
    validPicks,
    type Catalog,
    type GrantSummary,
    type Named,
    type Raised,
} from "./grants.ts";
import {
    addStartingEquipment as addStartingItems,
    addToInventory,
    armorClassFormula,
    carriedWeight,
    COIN_UNITS,
    evaluateEquipment,
    isProficient,
    sumExpression,
    unitWeight,
} from "./items.ts";
import {
    abilityFields,
    armorClassBonusField,
    armorClassField,
    classLevelField,
    classSpellFormulas,
    describeCharacter,
    dexterityOf,
    hitPointBaseField,
    hitPointBonusField,
    hitPointMaxField,
    initiativeBonusField,
    initiativeField,
    listAbilities,
    listClasses,
    listSkills,
    proficiencyBonusField,
    skillFields,
    SYSTEM,
    totalLevelField,
    type ClassInfo,
} from "./schema.ts";
import { maxSpellLevel, pactSlots, spellLimits, spellSlots } from "./spellcasting.ts";

// Spell ids of the class list and its expanded spells, cantrips only when the class learns them
function availableSpells(cat: Catalog, info: ClassInfo, expanded: readonly string[], maxLevel: number): string[] {
    const cantrips = info.data.spellcasting?.cantripsKnown !== undefined;
    return cat.spells
        .filter((spell) => {
            const data = spell.schema.data;
            if (data === undefined || !(data.classes.includes(info.id) || expanded.includes(spell.id))) return false;
            return data.level === 0 ? cantrips : data.level <= maxLevel;
        })
        .map((spell) => spell.id);
}

function isOwn(element: UiShapeCustomData): boolean {
    return element.source.toLowerCase() === SYSTEM;
}

// Matches the host's case-insensitive identity check, for elements already filtered by `ownElements`.
function matches(element: UiShapeCustomData, field: CharacterField): boolean {
    return (
        element.prefix.toLowerCase() === field.prefix.toLowerCase() &&
        element.name.toLowerCase() === field.name.toLowerCase()
    );
}

function ownElements(data: ReadonlyMap<LocalId, readonly UiShapeCustomData[]>, shape: LocalId): UiShapeCustomData[] {
    return (data.get(shape) ?? []).filter(isOwn);
}

function numberValue(elements: readonly UiShapeCustomData[], field: NumberField): number {
    const element = elements.find((element) => matches(element, field));
    return element?.kind === "number" ? element.value : field.default;
}

interface StoredBlocks {
    build: CharacterBuild;
    state: StateData;
    inventory: InventoryData;
}

// The prefixed variable, e.g. "{abilities/modifiers/str}", so the value matches what a roll would use.
// The host drops characters other than word characters, spaces and slashes, e.g. "/hit-points" becomes "hitpoints".
function variableOf(field: DiceExpressionField): string {
    const prefix = field.prefix.replaceAll(/[^\w /]/g, "").replace(/^\/+/, "");
    return `{${prefix}/${field.reference ?? field.name}}`;
}

function toElement(field: CharacterField, shapeId: GlobalId): ApiShapeCustomData {
    return {
        shapeId,
        source: SYSTEM,
        prefix: field.prefix,
        name: field.name,
        reference: field.reference,
        description: null,
        kind: field.kind,
        value: field.default,
    } as ApiShapeCustomData;
}

function sourceValues<K extends CompendiumKind>(record: Named | undefined, text: string): SourceValues<K> {
    return { id: record?.id, name: record?.name ?? text.trim(), choices: {} };
}

function grantItems(granted: ReadonlyMap<string, GrantSource[]>, names: readonly Named[]): EvaluatedGrantItem[] {
    return [...granted].map(([id, sources]) => ({
        id,
        name: names.find((entry) => entry.id === id)?.name ?? id,
        sources,
    }));
}

function evaluateItems(items: readonly InventoryItem[], summary: GrantSummary, cat: Catalog): EvaluatedItem[] {
    const weapons = new Set(summary.weapons.keys());
    const armor = new Set(summary.armor.keys());
    return items.map((item) => {
        const record = cat.items.find((record) => record.id === item.item);
        const data = record?.schema.data;
        return {
            ...item,
            name: record?.name ?? item.name,
            data,
            unitWeight: unitWeight(item, data),
            proficient:
                record === undefined || data === undefined ? undefined : isProficient(record, data, weapons, armor),
        };
    });
}

// The starting equipment of the starting class and the background
function startingEquipmentOf(
    character: Character5e,
    cat: Catalog,
): { source: GrantSource; lines: StartingEquipment[] }[] {
    const active = activeSources(cat, character);
    const list: { source: GrantSource; lines: StartingEquipment[] }[] = [];
    const starting = active.classes.find((activeClass) => activeClass.starting);
    const classLines = starting?.info.data.equipment;
    if (starting !== undefined && classLines !== undefined) {
        list.push({ source: { kind: "class", id: starting.info.id, name: starting.info.name }, lines: classLines });
    }
    const background = active.background;
    const backgroundLines = background?.schema.data?.equipment;
    if (background !== undefined && backgroundLines !== undefined) {
        list.push({ source: { kind: "background", id: background.id, name: background.name }, lines: backgroundLines });
    }
    return list;
}

function armorClassOf(items: readonly EvaluatedItem[], summary: GrantSummary, cat: Catalog): string {
    const reference = (abilityId: string): string | undefined => {
        const ability = cat.abilities.find((ability) => ability.id === abilityId);
        return ability === undefined ? undefined : `{${ability.abbreviation}}`;
    };
    const dexterity = dexterityOf(cat.abilities);
    return armorClassFormula(
        items,
        summary.unarmoredDefenses,
        dexterity === undefined ? "0" : `{${dexterity.abbreviation}}`,
        reference,
        `{${armorClassBonusField.reference}}`,
    );
}

type SimplifiedValue = DiceSimplification | PendingDiceSimplification;
type Simplified = Readonly<Ref<SimplifiedValue | undefined>>;

// Keys of the derived values that `useCharacter` simplifies
const PROFICIENCY_KEY = "proficiency";
const HIT_POINT_MAX_KEY = "hit-points/max";
const INITIATIVE_KEY = "initiative";
const ARMOR_CLASS_KEY = "armor-class";
const abilityModifierKey = (id: string): string => `abilities/${id}/modifier`;
const abilitySaveKey = (id: string): string => `abilities/${id}/save`;
const skillModifierKey = (id: string): string => `skills/${id}/modifier`;
const spellSaveDcKey = (classId: string): string => `spells/${classId}/save-dc`;
const spellAttackKey = (classId: string): string => `spells/${classId}/attack`;

// Takes the api rather than importing it from context.ts, so each service stays bound to the api it was
// created with, e.g. across a mod reload.
export function createCharacterService(api: GameApi): CharacterService {
    const system = api.systems.customData;
    const state = api.systemsState.customData;
    // The derived fields depend on the build and the inventory, so each arrival syncs them once all have loaded
    const builds = shapeBlocks(api, BUILD_BLOCK, emptyBuild, completeBuild, (shape) => syncDerived(shape));
    const states = shapeBlocks(api, STATE_BLOCK, emptyState, completeState, () => {});
    const inventories = shapeBlocks(api, INVENTORY_BLOCK, emptyInventory, completeInventory, (shape) =>
        syncDerived(shape),
    );

    function loadBlocks(shape: LocalId): void {
        builds.load(shape);
        states.load(shape);
        inventories.load(shape);
    }

    // Undefined until every block has loaded
    function blocksOf(shape: LocalId): StoredBlocks | undefined {
        const build = builds.get(shape);
        const state = states.get(shape);
        const inventory = inventories.get(shape);
        if (build === undefined || state === undefined || inventory === undefined) return undefined;
        return { build, state, inventory };
    }

    function catalog(): Catalog {
        const abilities = listAbilities(api.compendium.getEntries<Ability>(SYSTEM, "ability"));
        return {
            abilities,
            skills: listSkills(api.compendium.getEntries<Skill>(SYSTEM, "skill"), abilities),
            languages: api.compendium.getEntries<Language>(SYSTEM, "language"),
            backgrounds: api.compendium.getEntries<Background>(SYSTEM, "background"),
            races: api.compendium.getEntries<Race>(SYSTEM, "race"),
            subraces: api.compendium.getEntries<Subrace>(SYSTEM, "subrace"),
            classes: listClasses(api.compendium.getEntries<CharacterClass>(SYSTEM, "class")),
            subclasses: api.compendium.getEntries<Subclass>(SYSTEM, "subclass"),
            spells: api.compendium.getEntries<Spell>(SYSTEM, "spell"),
            items: api.compendium.getEntries<Item>(SYSTEM, "item"),
        };
    }

    function describe(): CharacterField[] {
        const cat = catalog();
        return describeCharacter(cat.abilities, cat.skills);
    }

    function elementsOf(shape: LocalId): UiShapeCustomData[] {
        return ownElements(state.readonly.data, shape);
    }

    // Creates the element when it is missing, and replaces one of another kind
    function setValue(shape: LocalId, field: CharacterField, value: ApiShapeCustomData["value"]): void {
        const element = elementsOf(shape).find((element) => matches(element, field));
        if (element?.kind === field.kind) {
            if (element.value !== value) system.updateValue(shape, element.id, value, true);
            return;
        }
        if (element !== undefined) system.removeElement(shape, element.id, true);
        const shapeId = api.getGlobalId(shape);
        if (shapeId === undefined) return;
        system.addElement({ ...toElement(field, shapeId), value } as ApiShapeCustomData, true);
    }

    function toCharacter(
        elements: readonly UiShapeCustomData[],
        blocks: StoredBlocks | undefined,
        cat: Catalog = catalog(),
    ): Character5e | undefined {
        if (blocks === undefined) return undefined;
        const { build } = blocks;

        const active = resolveSources(cat, build.background, build.race, build.subrace, build.classes);
        const classes: ClassValues[] = active.classes.map(({ info, level, subclass }) => {
            const lists = build.spells[info.id] ?? emptySpellLists();
            return {
                id: info.id,
                name: info.name,
                level,
                subclass: sourceValues(
                    subclass,
                    build.classes.find((selection) => selection.id === info.id)?.subclass ?? "",
                ),
                choices: {},
                spells: {
                    cantrips: resolveIds(cat.spells, lists.cantrips),
                    known: resolveIds(cat.spells, lists.known),
                    prepared: resolveIds(cat.spells, lists.prepared),
                },
            };
        });
        const character: Character5e = {
            schemaVersion: build.version,
            details: cloneJson(build.details),
            state: cloneJson(blocks.state.state),
            inventory: cloneJson(blocks.inventory.inventory),
            armorClassBonus: numberValue(elements, armorClassBonusField),
            initiativeBonus: numberValue(elements, initiativeBonusField),
            classes,
            level: classes.reduce((sum, values) => sum + values.level, 0),
            hitPointBonus: numberValue(elements, hitPointBonusField),
            abilities: {},
            skills: {},
            background: sourceValues(active.background, build.background),
            race: sourceValues(active.race, build.race),
            subrace: sourceValues(active.subrace, build.subrace),
            alignment: build.alignment,
            languages: resolveIds(cat.languages, build.languages),
            characteristics: { ...build.characteristics },
        };
        for (const ability of cat.abilities) {
            const fields = abilityFields(ability);
            character.abilities[ability.id] = {
                score: numberValue(elements, fields.score),
                saveProficiency: numberValue(elements, fields.saveProficiency),
            };
        }
        for (const skill of cat.skills) {
            character.skills[skill.id] = { proficiency: numberValue(elements, skillFields(skill).proficiency) };
        }
        for (const entry of sourceEntries(active)) {
            const choices = picksOf(character, entry.source);
            const stored = build.choices[choiceKey(entry.source)] ?? {};
            for (const choice of choicesOf(entry, cat)) {
                choices[choice.id] = validPicks(choice, stored[choice.id] ?? []);
            }
        }
        return character;
    }

    function read(shape: LocalId): Character5e | undefined {
        loadBlocks(shape);
        return toCharacter(elementsOf(shape), blocksOf(shape));
    }

    // These fields mirror the grants, classes and equipped armor, so formulas and rolls can use them
    function syncDerived(shape: LocalId): void {
        const cat = catalog();
        const character = read(shape);
        if (character === undefined) return;
        const summary = summarize(character, cat);
        const { increases } = summary;
        const armorClass = armorClassOf(evaluateItems(character.inventory.items, summary, cat), summary, cat);
        setValue(shape, armorClassField(armorClass), armorClass);
        for (const ability of cat.abilities) {
            const total = (increases.get(ability.id) ?? []).reduce((sum, increase) => sum + increase.amount, 0);
            setValue(shape, abilityFields(ability).increase, total);
        }
        setValue(shape, totalLevelField, character.level);
        for (const info of cat.classes) {
            const level = character.classes.find((values) => values.id === info.id)?.level;
            const field = classLevelField(info);
            if (level !== undefined) {
                setValue(shape, field, level);
                continue;
            }
            const element = elementsOf(shape).find((element) => matches(element, field));
            if (element !== undefined) system.removeElement(shape, element.id, true);
        }
        let base = 0;
        for (const { info, level, starting } of activeSources(cat, character).classes) {
            const average = info.hitDie / 2 + 1;
            base += starting ? info.hitDie + (level - 1) * average : level * average;
        }
        setValue(shape, hitPointBaseField, base);

        // Formulas are only created, so an edited formula stays
        const shapeId = api.getGlobalId(shape);
        const elements = elementsOf(shape);
        for (const { info, ability } of casterClasses(character, cat)) {
            if (shapeId === undefined || ability === undefined) continue;
            for (const field of Object.values(classSpellFormulas(info, ability))) {
                if (!elements.some((element) => matches(element, field))) {
                    system.addElement(toElement(field, shapeId), true);
                }
            }
        }
    }

    // Classes of the character that cast spells, with their spellcasting ability when it is registered
    function casterClasses(character: Character5e, cat: Catalog) {
        return character.classes.flatMap((values) => {
            const info = cat.classes.find((info) => info.id === values.id);
            const spellcasting = info?.data.spellcasting;
            if (info === undefined || spellcasting === undefined) return [];
            const ability = cat.abilities.find((ability) => ability.id === spellcasting.ability);
            return [{ info, values, spellcasting, ability }];
        });
    }

    function ensure(shape: LocalId): void {
        const shapeId = api.getGlobalId(shape);
        if (shapeId === undefined) return;

        const elements = elementsOf(shape);
        for (const field of describe()) {
            if (elements.some((element) => matches(element, field))) continue;
            system.addElement(toElement(field, shapeId), true);
        }
        loadBlocks(shape);
        syncDerived(shape);
    }

    // Compendium order first, languages outside the compendium after
    function knownLanguages(
        character: Character5e,
        granted: ReadonlyMap<string, GrantSource[]>,
        cat: Catalog,
    ): EvaluatedLanguage[] {
        const ids = new Set([...character.languages, ...granted.keys()]);
        const order = cat.languages.map((language) => language.id);
        const sorted = [...order.filter((id) => ids.has(id)), ...[...ids].filter((id) => !order.includes(id))];
        return sorted.map((id) => ({ id, own: character.languages.includes(id), sources: granted.get(id) ?? [] }));
    }

    function variablesOf(character: Character5e | undefined): Map<string, string> {
        const variables = new Map<string, string>();
        if (character === undefined) return variables;
        variables.set(PROFICIENCY_KEY, variableOf(proficiencyBonusField));
        variables.set(HIT_POINT_MAX_KEY, variableOf(hitPointMaxField));
        variables.set(ARMOR_CLASS_KEY, variableOf(armorClassField("")));
        const cat = catalog();
        const dexterity = dexterityOf(cat.abilities);
        if (dexterity !== undefined) variables.set(INITIATIVE_KEY, variableOf(initiativeField(dexterity)));
        for (const ability of cat.abilities) {
            if (!(ability.id in character.abilities)) continue;
            const { modifier, save } = abilityFields(ability);
            variables.set(abilityModifierKey(ability.id), variableOf(modifier));
            variables.set(abilitySaveKey(ability.id), variableOf(save));
        }
        for (const skill of cat.skills) {
            if (!(skill.id in character.skills)) continue;
            variables.set(skillModifierKey(skill.id), variableOf(skillFields(skill).modifier));
        }
        for (const { info, ability } of casterClasses(character, cat)) {
            if (ability === undefined) continue;
            const { saveDc, attackBonus } = classSpellFormulas(info, ability);
            variables.set(spellSaveDcKey(info.id), variableOf(saveDc));
            variables.set(spellAttackKey(info.id), variableOf(attackBonus));
        }
        return variables;
    }

    // Abilities and skills can be registered after the character is first shown,
    // so a simplification starts or stops whenever its key appears or disappears
    function useSimplifiedVariables(
        variables: Readonly<Ref<ReadonlyMap<string, string>>>,
        shape: Readonly<Ref<LocalId | undefined>>,
    ): Readonly<Ref<ReadonlyMap<string, Simplified>>> {
        const parent = effectScope();
        const scopes = new Map<string, EffectScope>();
        const simplified = shallowRef<ReadonlyMap<string, Simplified>>(new Map());

        watch(
            variables,
            (current) => {
                const next = new Map(simplified.value);
                let changed = false;
                for (const [key, scope] of scopes) {
                    if (current.has(key)) continue;
                    scope.stop();
                    scopes.delete(key);
                    next.delete(key);
                    changed = true;
                }
                for (const [key, variable] of current) {
                    if (scopes.has(key)) continue;
                    const scope = parent.run(() => effectScope())!;
                    next.set(
                        key,
                        scope.run(() => api.dice.useSimplified(variable, shape))!,
                    );
                    scopes.set(key, scope);
                    changed = true;
                }
                if (changed) simplified.value = next;
            },
            { immediate: true },
        );
        return simplified;
    }

    function useCharacter(
        shape: MaybeRefOrGetter<LocalId | null | undefined>,
    ): Readonly<Ref<EvaluatedCharacter | undefined>> {
        const lease = Symbol(`${SYSTEM} character`);
        const target = computed(() => toValue(shape) ?? undefined);

        watch(
            target,
            (current) => {
                api.systems.customData.loadAndDropState(new Set(current === undefined ? [] : [current]), lease);
                if (current !== undefined) ensure(current);
            },
            { immediate: true, flush: "sync" },
        );
        onScopeDispose(() => {
            api.systems.customData.loadAndDropState(new Set(), lease);
        });

        const stored = computed(() => {
            if (target.value === undefined) return undefined;
            return toCharacter(ownElements(state.reactive.data, target.value), blocksOf(target.value));
        });
        const variables = computed(() => variablesOf(stored.value));
        const simplified = useSimplifiedVariables(variables, target);

        return computed(() => {
            const character = stored.value;
            if (character === undefined) return undefined;
            const cat = catalog();
            const summary = summarize(character, cat);
            const active = activeSources(cat, character);
            const value = (key: string): SimplifiedValue => simplified.value.get(key)?.value ?? { kind: "pending" };
            // Abilities and skills of the character always have a variable
            const reference = (key: string): string => variables.value.get(key) ?? "0";
            const abilities: Record<string, EvaluatedAbility> = {};
            for (const [id, values] of Object.entries(character.abilities)) {
                const increases = summary.increases.get(id) ?? [];
                abilities[id] = {
                    ...values,
                    increase: increases.reduce((sum, increase) => sum + increase.amount, 0),
                    increases,
                    modifier: value(abilityModifierKey(id)),
                    save: value(abilitySaveKey(id)),
                    saveSources: summary.saves.get(id) ?? [],
                    modifierReference: reference(abilityModifierKey(id)),
                    saveReference: reference(abilitySaveKey(id)),
                };
            }
            const skills: Record<string, EvaluatedSkill> = {};
            for (const [id, values] of Object.entries(character.skills)) {
                skills[id] = {
                    ...values,
                    modifier: value(skillModifierKey(id)),
                    sources: summary.skills.get(id) ?? [],
                    expertiseSources: summary.expertise.get(id) ?? [],
                    modifierReference: reference(skillModifierKey(id)),
                };
            }
            const classes: EvaluatedClass[] = character.classes.flatMap((values) => {
                const info = cat.classes.find((info) => info.id === values.id);
                if (info === undefined) return [];
                const subclasses = subclassesOf(cat, info.id).map(({ id, name }) => ({ id, name }));
                return [
                    {
                        ...values,
                        hitDie: info.hitDie,
                        subclassTitle: info.data.subclassTitle,
                        subclassLevel: info.data.subclassLevel,
                        subclassPending:
                            values.level >= info.data.subclassLevel &&
                            values.subclass.id === undefined &&
                            subclasses.length > 0,
                        subclasses,
                    },
                ];
            });
            const hitDice: HitDice[] = [];
            for (const { hitDie, level } of classes) {
                const dice = hitDice.find((dice) => dice.die === hitDie);
                if (dice === undefined) hitDice.push({ die: hitDie, count: level });
                else dice.count += level;
            }
            hitDice.sort((a, b) => b.die - a.die);

            const casters = casterClasses(character, cat);
            const spellcasting: EvaluatedSpellcasting[] = casters.map(({ info, values, spellcasting }) => {
                const caster = { level: values.level, spellcasting };
                const modifier = abilities[spellcasting.ability]?.modifier;
                const limits = spellLimits(caster, modifier?.kind === "number" ? modifier.value : undefined);
                const maxLevel = maxSpellLevel(caster);
                return {
                    classId: info.id,
                    className: info.name,
                    ability: spellcasting.ability,
                    preparation: spellcasting.preparation,
                    saveDc: value(spellSaveDcKey(info.id)),
                    attackBonus: value(spellAttackKey(info.id)),
                    attackReference: variables.value.get(spellAttackKey(info.id)),
                    maxSpellLevel: maxLevel,
                    limits,
                    available: availableSpells(cat, info, summary.expandedSpells.get(info.id) ?? [], maxLevel),
                };
            });
            const resources: EvaluatedResource[] = active.classes.flatMap(({ info, level }) =>
                (info.data.resources ?? []).flatMap(({ id, name, max, recharge }) => {
                    const current = max[level - 1] ?? 0;
                    if (current <= 0) return [];
                    return [
                        { id, name, max: current, recharge, source: { kind: "class", id: info.id, name: info.name } },
                    ];
                }),
            );
            const warlock = casters.find(({ spellcasting }) => spellcasting.progression === "pact");

            const items = evaluateItems(character.inventory.items, summary, cat);
            const strength = cat.abilities.find((ability) => ability.abbreviation === "str");
            const dexterity = dexterityOf(cat.abilities);
            const modifierOf = (ability: Named | undefined): number | undefined => {
                if (ability === undefined) return 0;
                const modifier = abilities[ability.id]?.modifier;
                return modifier?.kind === "number" ? modifier.value : undefined;
            };
            const proficiency = value(PROFICIENCY_KEY);
            const addUp = (values: readonly (number | undefined)[]): number | undefined =>
                values.every((part): part is number => part !== undefined)
                    ? values.reduce((sum, part) => sum + part, 0)
                    : undefined;
            // With several abilities, as for a finesse weapon, the rolls use the better one
            const attackOf = (
                attack: Omit<
                    EvaluatedAttack,
                    "ability" | "attack" | "attackBonus" | "damageDice" | "damage" | "damageBonus" | "versatileDamage"
                > & {
                    abilities: readonly Named[];
                    attackBonus: number;
                    damage: string | undefined;
                    versatileDamage?: string;
                    damageAbility: boolean;
                    damageBonus: number;
                },
            ): EvaluatedAttack => {
                const {
                    abilities: used,
                    attackBonus,
                    damage,
                    versatileDamage,
                    damageAbility,
                    damageBonus,
                    ...rest
                } = attack;
                const modifiers = used.map(modifierOf);
                const known = modifiers.every((modifier): modifier is number => modifier !== undefined);
                const modifier = used.length === 0 ? 0 : known ? Math.max(...modifiers) : undefined;
                const ability = known ? used[modifiers.indexOf(modifier ?? 0)] : used[0];
                const references = used.map((ability) => reference(abilityModifierKey(ability.id)));
                const abilityReference =
                    references.length > 1 ? `max(${references.join(", ")})` : (references[0] ?? "");
                const proficiencyValue = proficiency.kind === "number" ? proficiency.value : undefined;
                const dice = damage?.trim() ?? "";
                const damageOf = (dice: string | undefined) =>
                    dice === undefined || dice.length === 0
                        ? undefined
                        : sumExpression([dice, damageAbility ? abilityReference : "", damageBonus]);
                return {
                    ...rest,
                    ability: ability?.id,
                    attack: sumExpression([
                        abilityReference,
                        attack.proficient ? reference(PROFICIENCY_KEY) : "",
                        attackBonus,
                    ]),
                    attackBonus: addUp([modifier, attack.proficient ? proficiencyValue : 0, attackBonus]),
                    damageDice: dice.length === 0 ? undefined : dice,
                    damage: damageOf(dice),
                    damageBonus: addUp([damageAbility ? modifier : 0, damageBonus]),
                    versatileDamage: damageOf(versatileDamage),
                };
            };
            const weaponAttacks = items.flatMap((item): EvaluatedAttack[] => {
                if (!item.equipped || item.data?.type !== "weapon") return [];
                const weapon = item.data;
                const finesse = weapon.properties.includes("finesse");
                const used = finesse ? [strength, dexterity] : [weapon.range === "ranged" ? dexterity : strength];
                return [
                    attackOf({
                        kind: "weapon",
                        id: item.id,
                        name: item.name,
                        abilities: used.filter((ability) => ability !== undefined),
                        proficient: item.proficient === true,
                        attackBonus: item.bonus,
                        damage: weapon.damage,
                        versatileDamage: weapon.versatile,
                        damageAbility: true,
                        damageBonus: item.bonus,
                        damageType: weapon.damageType,
                        distance: weapon.distance,
                        tags: weapon.properties,
                    }),
                ];
            });
            const manualAttacks = character.details.attacks.map((attack) =>
                attackOf({
                    kind: "manual",
                    id: attack.id,
                    name: attack.name,
                    abilities: cat.abilities.filter((ability) => ability.id === attack.ability),
                    proficient: attack.proficient,
                    attackBonus: attack.attackBonus,
                    damage: attack.damage,
                    damageAbility: attack.damageAbility,
                    damageBonus: attack.damageBonus,
                    damageType: attack.damageType.trim() || undefined,
                    distance: undefined,
                    tags: attack.tags,
                }),
            );
            const strengthValues = strength === undefined ? undefined : abilities[strength.id];

            return {
                ...character,
                classes,
                proficiencyBonus: proficiency,
                hitPointMax: value(HIT_POINT_MAX_KEY),
                armorClass: value(ARMOR_CLASS_KEY),
                armorClassReference: reference(ARMOR_CLASS_KEY),
                initiative: value(INITIATIVE_KEY),
                initiativeReference: variables.value.get(INITIATIVE_KEY),
                items,
                attacks: [...weaponAttacks, ...manualAttacks],
                carriedWeight: carriedWeight(items, character.inventory),
                carryingCapacity:
                    strengthValues === undefined ? undefined : (strengthValues.score + strengthValues.increase) * 15,
                startingEquipment: startingEquipmentOf(character, cat).map(({ source, lines }) => ({
                    source,
                    added: character.inventory.startingEquipment.includes(choiceKey(source)),
                    lines: evaluateEquipment(lines, cat.items),
                })),
                hitDice,
                spellcasting,
                grantedSpells: summary.grantedSpells,
                spellSlots: spellSlots(
                    casters.map(({ values, spellcasting }) => ({ level: values.level, spellcasting })),
                ),
                pactSlots: warlock === undefined ? undefined : pactSlots(warlock.values.level),
                resources,
                abilities,
                skills,
                knownLanguages: knownLanguages(character, summary.languages, cat),
                armor: grantItems(summary.armor, proficiencyNames(cat)),
                weapons: grantItems(summary.weapons, proficiencyNames(cat)),
                tools: grantItems(summary.tools, proficiencyNames(cat)),
                traits: summary.traits,
                choices: summary.choices,
                subracePending:
                    active.race !== undefined &&
                    active.subrace === undefined &&
                    subracesOf(cat, active.race.id).length > 0,
                speed: summary.speed,
                size: summary.size,
                darkvision: summary.darkvision,
            };
        });
    }

    function setAbilityScore(shape: LocalId, abilityId: string, score: number): void {
        const ability = catalog().abilities.find((ability) => ability.id === abilityId);
        if (ability !== undefined) setValue(shape, abilityFields(ability).score, score);
    }

    function setSaveProficiency(shape: LocalId, abilityId: string, proficiency: number): void {
        const ability = catalog().abilities.find((ability) => ability.id === abilityId);
        if (ability !== undefined) setValue(shape, abilityFields(ability).saveProficiency, proficiency);
    }

    function setSkillProficiency(shape: LocalId, skillId: string, proficiency: number): void {
        const skill = catalog().skills.find((skill) => skill.id === skillId);
        if (skill !== undefined) setValue(shape, skillFields(skill).proficiency, proficiency);
    }

    // Grants only ever raise, so expertise and half proficiency survive and a lost grant lowers nothing.
    // Skills go before expertise, so a skill both granted and picked for expertise ends up at 2.
    function raise(shape: LocalId, character: Character5e, raised: Partial<Raised>): void {
        for (const skillId of raised.skills ?? []) {
            const current = character.skills[skillId]?.proficiency;
            if (current !== undefined && current < 1) setSkillProficiency(shape, skillId, 1);
        }
        for (const skillId of raised.expertise ?? []) {
            const current = character.skills[skillId]?.proficiency;
            if (current !== undefined && current < 2) setSkillProficiency(shape, skillId, 2);
        }
        for (const abilityId of raised.saves ?? []) {
            const current = character.abilities[abilityId]?.saveProficiency;
            if (current !== undefined && current < 1) setSaveProficiency(shape, abilityId, 1);
        }
    }

    function entryKeys(shape: LocalId, cat: Catalog): Set<string> {
        const character = read(shape);
        if (character === undefined) return new Set();
        return new Set(sourceEntries(activeSources(cat, character)).map((entry) => entry.key));
    }

    // Raises what every entry that is new compared to `before` grants, then syncs the derived fields
    function afterSourceChange(shape: LocalId, before: ReadonlySet<string>): void {
        const cat = catalog();
        const character = read(shape);
        if (character === undefined) return;
        const raised: Raised = { skills: [], expertise: [], saves: [] };
        for (const entry of sourceEntries(activeSources(cat, character))) {
            if (before.has(entry.key)) continue;
            const { skills, expertise, saves } = raisedBy(entry, cat, picksOf(character, entry.source));
            raised.skills.push(...skills);
            raised.expertise.push(...expertise);
            raised.saves.push(...saves);
        }
        raise(shape, character, raised);
        syncDerived(shape);
    }

    function setBackground(shape: LocalId, text: string): void {
        const cat = catalog();
        const before = entryKeys(shape, cat);
        builds.update(shape, (build) => {
            build.background = findEntry(cat.backgrounds, text)?.id ?? text.trim();
        });
        afterSourceChange(shape, before);
    }

    function setRace(shape: LocalId, text: string): void {
        const cat = catalog();
        const before = entryKeys(shape, cat);
        const current = read(shape);
        const subrace = findEntry(cat.subraces, text);
        const subraceRace = cat.races.find((race) => race.id === subrace?.schema.data?.race);
        const race = subraceRace ?? findEntry(cat.races, text);
        builds.update(shape, (build) => {
            if (subrace !== undefined && subraceRace !== undefined) {
                build.race = subraceRace.id;
                build.subrace = subrace.id;
            } else if (race !== undefined) {
                build.race = race.id;
                if (current?.race.id !== race.id) build.subrace = "";
            } else {
                build.race = text.trim();
                build.subrace = "";
            }
        });
        afterSourceChange(shape, before);
    }

    function setSubrace(shape: LocalId, text: string): void {
        const cat = catalog();
        const before = entryKeys(shape, cat);
        const raceId = read(shape)?.race.id;
        if (raceId === undefined) return;
        const subrace = findEntry(subracesOf(cat, raceId), text);
        builds.update(shape, (build) => {
            build.subrace = subrace?.id ?? text.trim();
        });
        afterSourceChange(shape, before);
    }

    // Adding a class appends it, so the first class added stays the starting class
    function setClassLevel(shape: LocalId, classText: string, level: number): void {
        const cat = catalog();
        const info = findEntry(cat.classes, classText);
        if (info === undefined || read(shape) === undefined) return;
        const before = entryKeys(shape, cat);
        const clamped = Math.min(Math.max(Math.round(level), 0), 20);
        builds.update(shape, (build) => {
            const entry = build.classes.find((entry) => entry.id === info.id);
            if (clamped === 0) build.classes = build.classes.filter((entry) => entry.id !== info.id);
            else if (entry !== undefined) entry.level = clamped;
            else build.classes.push({ id: info.id, level: clamped, subclass: "" });
        });
        afterSourceChange(shape, before);
    }

    function setSubclass(shape: LocalId, classText: string, text: string): void {
        const cat = catalog();
        const info = findEntry(cat.classes, classText);
        if (info === undefined) return;
        const before = entryKeys(shape, cat);
        const subclass = findEntry(subclassesOf(cat, info.id), text);
        builds.update(shape, (build) => {
            const entry = build.classes.find((entry) => entry.id === info.id);
            if (entry !== undefined) entry.subclass = subclass?.id ?? text.trim();
        });
        afterSourceChange(shape, before);
    }

    function setStartingClass(shape: LocalId, classText: string): void {
        const cat = catalog();
        const info = findEntry(cat.classes, classText);
        if (info === undefined) return;
        const before = entryKeys(shape, cat);
        builds.update(shape, (build) => {
            const index = build.classes.findIndex((entry) => entry.id === info.id);
            if (index > 0) build.classes.unshift(...build.classes.splice(index, 1));
        });
        afterSourceChange(shape, before);
    }

    function setHitPointBonus(shape: LocalId, bonus: number): void {
        setValue(shape, hitPointBonusField, bonus);
    }

    function setChoice(
        shape: LocalId,
        source: Pick<GrantSource, "kind" | "id">,
        choiceId: string,
        picks: readonly string[],
    ): void {
        const cat = catalog();
        const character = read(shape);
        if (character === undefined) return;
        const entry = sourceEntries(activeSources(cat, character)).find(
            (entry) =>
                entry.source.kind === source.kind &&
                entry.source.id === source.id &&
                choicesOf(entry, cat).some((choice) => choice.id === choiceId),
        );
        const choice = entry && choicesOf(entry, cat).find((choice) => choice.id === choiceId);
        if (entry === undefined || choice === undefined) return;

        const valid = validPicks(choice, picks);
        const previous = picksOf(character, choice.source)[choice.id] ?? [];
        const added = valid.filter((id) => !previous.includes(id));
        builds.update(shape, (build) => {
            (build.choices[choiceKey(choice.source)] ??= {})[choice.id] = valid;
        });
        if (choice.kind === "skill") raise(shape, character, { skills: added });
        if (choice.kind === "expertise") raise(shape, character, { expertise: added });
        if (choice.kind === "option") {
            const raised: Raised = { skills: [], expertise: [], saves: [] };
            for (const grants of pickedOptionGrants(entry, { [choice.id]: added })) {
                raised.skills.push(...(grants.skills?.filter((grant) => typeof grant === "string") ?? []));
                raised.expertise.push(...(grants.expertise?.filter((grant) => typeof grant === "string") ?? []));
                raised.saves.push(...(grants.savingThrows ?? []));
            }
            raise(shape, character, raised);
        }
        if (choice.kind === "ability" || choice.kind === "option") syncDerived(shape);
    }

    function setSpells(shape: LocalId, classText: string, list: SpellList, spells: readonly string[]): void {
        const cat = catalog();
        const character = read(shape);
        if (character === undefined) return;
        const caster = casterClasses(character, cat).find(({ info }) => findEntry([info], classText) !== undefined);
        if (caster === undefined) return;
        const { info, values, spellcasting } = caster;
        const expanded = summarize(character, cat).expandedSpells.get(info.id) ?? [];
        const available = new Set(
            availableSpells(cat, info, expanded, maxSpellLevel({ level: values.level, spellcasting })),
        );
        const levelOf = (id: string): number | undefined =>
            cat.spells.find((spell) => spell.id === id)?.schema.data?.level;
        const fits = (id: string): boolean => {
            if (list === "prepared" && spellcasting.preparation === "spellbook") {
                return values.spells.known.includes(id);
            }
            return available.has(id) && (list === "cantrips") === (levelOf(id) === 0);
        };
        const valid = resolveIds(cat.spells, spells).filter(fits);
        builds.update(shape, (build) => {
            const lists = (build.spells[info.id] ??= emptySpellLists());
            lists[list] = valid;
            if (list === "known" && spellcasting.preparation === "spellbook") {
                lists.prepared = lists.prepared.filter((id) => valid.includes(id));
            }
        });
    }

    function setLanguages(shape: LocalId, known: readonly string[]): void {
        const languages = resolveIds(catalog().languages, known);
        builds.update(shape, (build) => {
            build.languages = languages;
        });
    }

    function setCharacteristic(shape: LocalId, characteristic: Characteristic, text: string): void {
        builds.update(shape, (build) => {
            build.characteristics[characteristic] = text;
        });
    }

    function setAlignment(shape: LocalId, alignment: string): void {
        builds.update(shape, (build) => {
            build.alignment = alignment.trim();
        });
    }

    function setDetails(shape: LocalId, details: Partial<CharacterDetails>): void {
        builds.update(shape, (build) => {
            build.details = { ...build.details, ...cloneJson(details) };
        });
    }

    function setState(shape: LocalId, state: Partial<CharacterState>): void {
        states.update(shape, (data) => {
            data.state = { ...data.state, ...cloneJson(state) };
        });
    }

    function setArmorClassBonus(shape: LocalId, bonus: number): void {
        setValue(shape, armorClassBonusField, bonus);
    }

    function setInitiativeBonus(shape: LocalId, bonus: number): void {
        setValue(shape, initiativeBonusField, bonus);
    }

    function addItem(shape: LocalId, item: NewItem): void {
        const items = catalog().items;
        inventories.update(shape, (data) => addToInventory(data.inventory, items, item));
    }

    // Body armor and shields are worn one at a time, so equipping one takes off the other of its kind
    function updateItem(shape: LocalId, id: string, change: Partial<Omit<InventoryItem, "id" | "item">>): void {
        const items = catalog().items;
        const slotOf = (item: InventoryItem): string | undefined => {
            const data = items.find((record) => record.id === item.item)?.schema.data;
            if (data?.type !== "armor") return undefined;
            return data.category === "shield" ? "shield" : "armor";
        };
        inventories.update(shape, (data) => {
            const item = data.inventory.items.find((item) => item.id === id);
            if (item === undefined) return;
            const { name, quantity, equipped, bonus, weight, notes } = change;
            if (name !== undefined && item.item === undefined && name.trim().length > 0) item.name = name.trim();
            if (quantity !== undefined) item.quantity = Math.max(Math.round(quantity), 0);
            if (bonus !== undefined) item.bonus = Math.round(bonus);
            if (weight !== undefined && item.item === undefined) item.weight = Math.max(weight, 0);
            if (notes !== undefined) item.notes = notes;
            if (equipped !== undefined) item.equipped = equipped;
            const slot = slotOf(item);
            if (equipped === true && slot !== undefined) {
                for (const other of data.inventory.items) {
                    if (other !== item && slotOf(other) === slot) other.equipped = false;
                }
            }
        });
        syncDerived(shape);
    }

    function removeItem(shape: LocalId, id: string): void {
        inventories.update(shape, (data) => {
            data.inventory.items = data.inventory.items.filter((item) => item.id !== id);
        });
        syncDerived(shape);
    }

    function setCoins(shape: LocalId, coins: Partial<Coins>): void {
        inventories.update(shape, (data) => {
            for (const unit of COIN_UNITS) {
                const amount = coins[unit];
                if (amount !== undefined) data.inventory.coins[unit] = Math.max(Math.round(amount), 0);
            }
        });
    }

    function addStartingEquipment(
        shape: LocalId,
        source: Pick<GrantSource, "kind" | "id">,
        picks: readonly StartingEquipmentPick[],
    ): void {
        const cat = catalog();
        const character = read(shape);
        if (character === undefined) return;
        const entry = startingEquipmentOf(character, cat).find(
            (entry) => entry.source.kind === source.kind && entry.source.id === source.id,
        );
        if (entry === undefined) return;
        const key = choiceKey(entry.source);
        inventories.update(shape, (data) => {
            if (data.inventory.startingEquipment.includes(key)) return;
            if (addStartingItems(data.inventory, cat.items, entry.lines, picks))
                data.inventory.startingEquipment.push(key);
        });
    }

    return {
        schemaVersion: BUILD_VERSION,
        describe,
        read,
        useCharacter,
        ensure,
        setClassLevel,
        setSubclass,
        setStartingClass,
        setHitPointBonus,
        setAbilityScore,
        setSaveProficiency,
        setSkillProficiency,
        setBackground,
        setRace,
        setSubrace,
        setChoice,
        setSpells,
        setLanguages,
        setCharacteristic,
        setAlignment,
        setDetails,
        setState,
        setArmorClassBonus,
        setInitiativeBonus,
        addItem,
        updateItem,
        removeItem,
        setCoins,
        addStartingEquipment,
    };
}
