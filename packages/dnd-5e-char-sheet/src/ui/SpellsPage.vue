<script setup lang="ts">
import type { DiceSimplification, PendingDiceSimplification } from "@planarally/mod-api";
import type { CompendiumId, CompendiumRef, SpellList } from "@planarally/system-dnd-5e-srd";
import { computed, reactive, ref } from "vue";

import { api, hasCompendiumEntry } from "../context";

import ChoicePicker from "./ChoicePicker.vue";
import { derivedStats, setOpenedSpells, type SheetSpell, type SheetSpellcasting, type SheetStats } from "./data";
import { ROLL_HINT, rollD20 } from "./rolls";
import { signed, spellLevelName, type Character } from "./sheet";

const props = defineProps<{ stats: SheetStats | undefined }>();
const model = defineModel<Character>({ required: true });
const character = reactive(model.value);

const casting = computed(() => props.stats?.spellcasting ?? []);
const spellIndex = computed(() => props.stats?.spells ?? new Map<CompendiumId<"spell">, SheetSpell>());
const derived = computed(() => derivedStats(props.stats));
const spellChoices = computed(() => (props.stats?.choices ?? []).filter((choice) => choice.kind === "spell"));

function abilityShort(id: CompendiumId<"ability"> | undefined): string {
    return props.stats?.abilities.find((ability) => ability.id === id)?.abbreviation.toUpperCase() ?? "";
}

function numberOf(value: DiceSimplification | PendingDiceSimplification): number | undefined {
    return value.kind === "number" ? value.value : undefined;
}

// Granted spells outside a class, e.g. racial spells, use the save DC formula with their own ability
const otherCasting = computed(() => {
    const abilities = new Set<CompendiumId<"ability">>();
    for (const spell of props.stats?.grantedSpells ?? []) {
        if (spell.classId === undefined && spell.ability !== undefined) abilities.add(spell.ability);
    }
    return [...abilities].map((id) => {
        const short = abilityShort(id);
        const modifier = derived.value.modifiers[short.toLowerCase()] ?? 0;
        return {
            id,
            short,
            saveDc: 8 + derived.value.proficiency + modifier,
            attack: derived.value.proficiency + modifier,
        };
    });
});

// The list that levelled spells are added to: prepared casters prepare from the whole class list
function spellListOf(caster: SheetSpellcasting): SpellList {
    return caster.preparation === "prepared" ? "prepared" : "known";
}

interface Count {
    label: string;
    current: number;
    limit: number | undefined;
    title?: string;
}

function countsOf(caster: SheetSpellcasting): Count[] {
    const { limits, spells } = caster;
    const counts: Count[] = [];
    if (limits.cantrips !== undefined) {
        counts.push({ label: "Cantrips", current: spells.cantrips.length, limit: limits.cantrips });
    }
    if (caster.preparation === "known") {
        counts.push({ label: "Known", current: spells.known.length, limit: limits.known });
    }
    if (caster.preparation === "spellbook") {
        counts.push({
            label: "Spellbook",
            current: spells.known.length,
            limit: limits.known,
            title: "Spells gained from wizard levels; spells copied from scrolls and books come on top",
        });
    }
    if (caster.preparation !== "known") {
        counts.push({ label: "Prepared", current: spells.prepared.length, limit: limits.prepared });
    }
    return counts;
}

function addable(caster: SheetSpellcasting, list: SpellList): Map<number, SheetSpell[]> {
    const taken = caster.spells[list];
    const byLevel = new Map<number, SheetSpell[]>();
    for (const id of caster.available) {
        const spell = spellIndex.value.get(id);
        if (spell === undefined || taken.includes(id)) continue;
        if ((list === "cantrips") !== (spell.data.level === 0)) continue;
        byLevel.set(spell.data.level, [...(byLevel.get(spell.data.level) ?? []), spell]);
    }
    for (const spells of byLevel.values()) spells.sort((a, b) => a.name.localeCompare(b.name));
    return new Map([...byLevel].sort(([a], [b]) => a - b));
}

function add(caster: SheetSpellcasting, list: SpellList, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    select.value = "";
    if (id.length > 0) setOpenedSpells(caster.classId, list, [...caster.spells[list], id]);
}

function remove(caster: SheetSpellcasting, list: SpellList, id: CompendiumId<"spell">): void {
    setOpenedSpells(
        caster.classId,
        list,
        caster.spells[list].filter((spell) => spell !== id),
    );
}

function togglePrepared(caster: SheetSpellcasting, id: CompendiumId<"spell">): void {
    const prepared = caster.spells.prepared;
    setOpenedSpells(
        caster.classId,
        "prepared",
        prepared.includes(id) ? prepared.filter((spell) => spell !== id) : [...prepared, id],
    );
}

interface SpellRow {
    key: string;
    id: CompendiumId<"spell">;
    name: string;
    // Undefined when the id has no compendium entry
    spell: SheetSpell | undefined;
    source: string;
    // Granted spells are always prepared
    always?: boolean;
    // Only for spellbook spells, which are prepared separately
    prepared?: boolean;
    caster?: SheetSpellcasting;
    list?: SpellList;
}

// A readable name for an id without a compendium entry,
function nameFromId(id: CompendiumId<"spell">): string {
    const words = id.replaceAll("-", " ");
    return words.charAt(0).toUpperCase() + words.slice(1);
}

const rows = computed(() => {
    const result: SpellRow[] = [];
    const push = (id: CompendiumId<"spell">, row: Omit<SpellRow, "key" | "id" | "name" | "spell">): void => {
        const spell = spellIndex.value.get(id);
        const name = spell?.name ?? nameFromId(id);
        result.push({ key: `${row.list ?? "granted"}/${row.source}/${id}`, id, name, spell, ...row });
    };
    for (const caster of casting.value) {
        const source = caster.className;
        for (const id of caster.spells.cantrips) push(id, { source, caster, list: "cantrips" });
        const list = spellListOf(caster);
        for (const id of caster.spells[list]) {
            const prepared = caster.preparation === "spellbook" ? caster.spells.prepared.includes(id) : undefined;
            push(id, { source, caster, list, prepared });
        }
    }
    for (const granted of props.stats?.grantedSpells ?? []) {
        push(granted.id, { source: granted.source.name, always: true });
    }
    return result;
});

// Spells without a compendium entry have no known level, so they get their own group at the end
const MISSING = Number.POSITIVE_INFINITY;

const levels = computed(() => {
    const byLevel = new Map<number, SpellRow[]>();
    for (const row of rows.value) {
        const level = row.spell?.data.level ?? MISSING;
        byLevel.set(level, [...(byLevel.get(level) ?? []), row]);
    }
    for (const group of byLevel.values()) group.sort((a, b) => a.name.localeCompare(b.name));
    return [...byLevel].sort(([a], [b]) => a - b);
});

function levelHeading(level: number): string {
    if (level === MISSING) return "Missing from the compendium";
    return level === 0 ? "Cantrips" : `${spellLevelName(level)} level`;
}

const expanded = ref(new Set<string>());

function toggleExpanded(key: string): void {
    const next = new Set(expanded.value);
    if (!next.delete(key)) next.add(key);
    expanded.value = next;
}

function levelLine(spell: SheetSpell): string {
    const { level, school } = spell.data;
    return level === 0 ? `${school} cantrip` : `${spellLevelName(level)}-level ${school.toLowerCase()}`;
}

function componentsOf(spell: SheetSpell): string {
    const { verbal, somatic, material } = spell.data.components;
    return [verbal ? "V" : "", somatic ? "S" : "", material === null ? "" : `M (${material})`]
        .filter((part) => part.length > 0)
        .join(", ");
}

interface TextSegment {
    text: string;
    // Of a `compendium:` link
    ref?: CompendiumRef;
}

const COMPENDIUM_LINK = /\[([^\]]+)\]\(compendium:([^)\s]+)\)/g;

function segmentsOf(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let last = 0;
    for (const match of text.matchAll(COMPENDIUM_LINK)) {
        if (match.index > last) segments.push({ text: text.slice(last, match.index) });
        segments.push({ text: match[1] ?? "", ref: match[2] });
        last = match.index + match[0].length;
    }
    if (last < text.length) segments.push({ text: text.slice(last) });
    return segments;
}

// The body without its level line and casting stats, which the row and the summary line already show.
// A reaction's trigger only appears in those stats, so it leads instead.
function descriptionOf(spell: SheetSpell): TextSegment[][] {
    const { trigger } = spell.data;
    const paragraphs = spell.body
        .split(/\n{2,}/)
        .filter((block) => !/^\*[^*]/.test(block) && !block.includes("**Casting Time:**"))
        .map((block) => segmentsOf(block.replaceAll(/\*\*?([^*]+)\*\*?/g, "$1")));
    return trigger === undefined ? paragraphs : [segmentsOf(`Trigger: ${trigger}`), ...paragraphs];
}

function openRule(ref: CompendiumRef, event: MouseEvent): void {
    api.compendium.openRuleAt(ref, event.clientX, event.clientY);
}

const slotLevels = computed(() =>
    (props.stats?.spellSlots ?? []).flatMap((max, index) => (max > 0 ? [{ level: index + 1, max }] : [])),
);

const hasSlots = computed(
    () =>
        slotLevels.value.length > 0 || props.stats?.pactSlots !== undefined || (props.stats?.resources.length ?? 0) > 0,
);

function toggleSlot(level: number, pip: number): void {
    const spent = character.spentSlots[level - 1] ?? 0;
    character.spentSlots[level - 1] = spent === pip ? pip - 1 : pip;
}

function togglePactSlot(pip: number): void {
    character.spentPactSlots = character.spentPactSlots === pip ? pip - 1 : pip;
}

function setResourceRemaining(id: string, max: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const remaining = Math.min(Math.max(Math.trunc(Number(input.value)), 0), max);
    if (Number.isFinite(remaining)) character.spentResources[id] = max - remaining;
    input.value = String(max - (character.spentResources[id] ?? 0));
}
</script>

<template>
    <div class="spells">
        <p v-if="casting.length === 0 && rows.length === 0 && spellChoices.length === 0" class="hint">
            No spellcasting yet. Spells appear here once a class or race grants them.
        </p>

        <div
            v-if="casting.length > 0 || otherCasting.length > 0 || hasSlots"
            class="casting"
            :class="{ single: casting.length <= 1 }"
        >
            <section v-for="caster in casting" :key="caster.classId" class="caster">
                <h2>{{ caster.className }} · {{ abilityShort(caster.ability) }}</h2>
                <div class="numbers">
                    <span class="number">
                        <span>Save DC</span>
                        <strong>{{ numberOf(caster.saveDc) ?? "—" }}</strong>
                    </span>
                    <span class="number">
                        <span>Attack</span>
                        <button
                            v-if="caster.attackReference !== undefined"
                            type="button"
                            class="rollable"
                            :title="ROLL_HINT"
                            :aria-label="`Roll ${caster.className} spell attack`"
                            @click="rollD20(caster.attackReference, `${caster.className} spell attack`, $event)"
                        >
                            {{
                                numberOf(caster.attackBonus) === undefined ? "—" : signed(numberOf(caster.attackBonus)!)
                            }}
                        </button>
                        <strong v-else>—</strong>
                    </span>
                    <span
                        v-for="count in countsOf(caster)"
                        :key="count.label"
                        class="number"
                        :class="{
                            under: count.limit !== undefined && count.current < count.limit,
                            over: count.limit !== undefined && count.current > count.limit,
                        }"
                        :title="count.title"
                    >
                        <span>{{ count.label }}</span>
                        <strong
                            >{{ count.current }}<small>/{{ count.limit ?? "?" }}</small></strong
                        >
                    </span>
                </div>
                <div class="adders">
                    <select
                        v-if="caster.limits.cantrips !== undefined"
                        :aria-label="`Add a ${caster.className} cantrip`"
                        @change="add(caster, 'cantrips', $event)"
                    >
                        <option value="">Add cantrip…</option>
                        <option v-for="spell in addable(caster, 'cantrips').get(0)" :key="spell.id" :value="spell.id">
                            {{ spell.name }}
                        </option>
                    </select>
                    <select
                        v-if="caster.maxSpellLevel > 0"
                        :aria-label="`Add a ${caster.className} spell`"
                        @change="add(caster, spellListOf(caster), $event)"
                    >
                        <option value="">
                            {{
                                caster.preparation === "prepared"
                                    ? "Prepare spell…"
                                    : caster.preparation === "spellbook"
                                      ? "Add to spellbook…"
                                      : "Learn spell…"
                            }}
                        </option>
                        <optgroup
                            v-for="[level, spells] in addable(caster, spellListOf(caster))"
                            :key="level"
                            :label="`${spellLevelName(level)} level`"
                        >
                            <option v-for="spell in spells" :key="spell.id" :value="spell.id">{{ spell.name }}</option>
                        </optgroup>
                    </select>
                    <span v-else-if="caster.limits.cantrips === undefined" class="hint">
                        Spellcasting starts at a higher level
                    </span>
                </div>
            </section>
            <section v-for="other in otherCasting" :key="other.id" class="caster">
                <h2>Granted · {{ other.short }}</h2>
                <div class="numbers">
                    <span class="number">
                        <span>Save DC</span>
                        <strong>{{ other.saveDc }}</strong>
                    </span>
                    <span class="number">
                        <span>Attack</span>
                        <button
                            type="button"
                            class="rollable"
                            :title="ROLL_HINT"
                            :aria-label="`Roll ${other.short} spell attack`"
                            @click="rollD20(String(other.attack), `Spell attack (${other.short})`, $event)"
                        >
                            {{ signed(other.attack) }}
                        </button>
                    </span>
                </div>
            </section>
            <section v-if="hasSlots" class="slots">
                <h2>Slots &amp; resources</h2>
                <div v-for="{ level, max } in slotLevels" :key="level" class="slot">
                    <span>{{ spellLevelName(level) }}</span>
                    <span class="pips">
                        <button
                            v-for="pip in max"
                            :key="pip"
                            type="button"
                            class="pip"
                            :class="{ on: pip <= (character.spentSlots[level - 1] ?? 0) }"
                            :aria-pressed="pip <= (character.spentSlots[level - 1] ?? 0)"
                            :aria-label="`${spellLevelName(level)} slot ${pip} spent`"
                            @click="toggleSlot(level, pip)"
                        />
                    </span>
                </div>
                <div v-if="stats?.pactSlots" class="slot" title="Pact Magic slots recover on a short rest">
                    <span>Pact {{ spellLevelName(stats.pactSlots.level) }}</span>
                    <span class="pips">
                        <button
                            v-for="pip in stats.pactSlots.count"
                            :key="pip"
                            type="button"
                            class="pip"
                            :class="{ on: pip <= character.spentPactSlots }"
                            :aria-pressed="pip <= character.spentPactSlots"
                            :aria-label="`Pact slot ${pip} spent`"
                            @click="togglePactSlot(pip)"
                        />
                    </span>
                </div>
                <label
                    v-for="resource in stats?.resources"
                    :key="resource.id"
                    class="slot"
                    :title="`Recovers on a ${resource.recharge} rest`"
                >
                    <span>{{ resource.name }}</span>
                    <span>
                        <input
                            :value="resource.max - (character.spentResources[resource.id] ?? 0)"
                            type="number"
                            min="0"
                            :max="resource.max"
                            :aria-label="`${resource.name} remaining`"
                            @change="setResourceRemaining(resource.id, resource.max, $event)"
                        />
                        <span class="of">/ {{ resource.max }}</span>
                    </span>
                </label>
            </section>
        </div>

        <div v-if="spellChoices.length > 0" class="choices">
            <ChoicePicker
                v-for="choice in spellChoices"
                :key="`${choice.source.kind}/${choice.source.id}/${choice.id}`"
                :choice="choice"
            />
        </div>

        <div class="groups">
            <section v-for="[level, group] in levels" :key="level">
                <h2>{{ levelHeading(level) }}</h2>
                <template v-for="row in group" :key="row.key">
                    <div
                        class="spell"
                        :class="{ missing: row.spell === undefined }"
                        :title="row.spell === undefined ? `No compendium entry for “${row.id}”` : undefined"
                    >
                        <input
                            v-if="row.prepared !== undefined"
                            :checked="row.prepared"
                            type="checkbox"
                            :aria-label="`Prepared ${row.name}`"
                            @change="togglePrepared(row.caster!, row.id)"
                        />
                        <span v-else-if="row.always" class="always" title="Always prepared">◆</span>
                        <span v-else></span>
                        <button
                            v-if="row.spell"
                            type="button"
                            class="name"
                            :aria-expanded="expanded.has(row.key)"
                            @click="toggleExpanded(row.key)"
                        >
                            {{ row.name }}
                        </button>
                        <span v-else class="name">{{ row.name }}</span>
                        <span class="stat">{{ row.spell?.data.castingTime ?? "—" }}</span>
                        <span class="stat">{{ row.spell?.data.range ?? "—" }}</span>
                        <span class="mark" :class="{ on: row.spell?.data.concentration }" title="Concentration">C</span>
                        <span class="mark" :class="{ on: row.spell?.data.ritual }" title="Ritual">R</span>
                        <em class="source">{{ row.source }}</em>
                        <button
                            v-if="row.caster && row.list"
                            type="button"
                            class="remove"
                            :aria-label="`Remove ${row.name}`"
                            @click="remove(row.caster, row.list, row.id)"
                        >
                            ×
                        </button>
                        <span v-else></span>
                    </div>
                    <div v-if="row.spell && expanded.has(row.key)" class="description">
                        <p class="summary">
                            {{ levelLine(row.spell) }} · {{ componentsOf(row.spell) }} · {{ row.spell.data.duration }}
                        </p>
                        <p v-for="(paragraph, index) in descriptionOf(row.spell)" :key="index">
                            <template v-for="(segment, part) in paragraph" :key="part">
                                <template v-if="segment.ref === undefined">{{ segment.text }}</template>
                                <a
                                    v-else-if="hasCompendiumEntry(segment.ref)"
                                    href="#"
                                    class="rule"
                                    @click.prevent="openRule(segment.ref, $event)"
                                    >{{ segment.text }}</a
                                >
                                <span v-else class="rule missing" :title="`No compendium entry for “${segment.ref}”`">{{
                                    segment.text
                                }}</span>
                            </template>
                        </p>
                    </div>
                </template>
            </section>
        </div>
    </div>
</template>

<style scoped>
input[type="number"] {
    appearance: textfield;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
}

.spells {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.75rem;
    box-sizing: border-box;
    color: #1b120c;
    font-family: Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif;
    font-size: 15px;
}

.casting {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.6rem;
}

.caster,
.slots {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid #3a2a1e;
    background: rgba(255, 252, 245, 0.35);
    padding: 0.4rem 0.7rem 0.55rem;
}

h2,
.number > span,
.slot > span:first-child {
    margin: 0;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5a4032;
    font-weight: 700;
}

.casting.single {
    align-items: stretch;
    gap: 0.6rem 1.4rem;
    border: 1px solid #3a2a1e;
    background: rgba(255, 252, 245, 0.35);
    padding: 0.4rem 0.7rem 0.55rem;
}

.casting.single > section {
    border: none;
    background: none;
    padding: 0;
}

.casting.single > section + section {
    border-left: 1px solid #d9cbb6;
    padding-left: 1.4rem;
}

.casting.single .slots {
    flex: 1 1 14rem;
    flex-direction: row;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 0.45rem 1.2rem;
}

.casting.single .slots h2 {
    flex-basis: 100%;
    margin-bottom: 0;
}

.casting.single .slot {
    display: flex;
    gap: 0.4rem;
}

.numbers {
    display: flex;
    gap: 1.5rem;
}

.number {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    border-bottom: 1px solid #3a2a1e;
    min-width: 3.8rem;
}

.number strong {
    font-size: 1.2rem;
    font-weight: 400;
}

.number .rollable {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 1.2rem;
    text-align: left;
    padding: 0;
    cursor: pointer;
}

.number .rollable:hover {
    color: #8a5a2a;
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}

.number small {
    font-size: 0.75rem;
    color: #5a4032;
}

.number.under strong {
    color: #8a2e24;
}

.number.over strong {
    color: #8a2e24;
    text-decoration: underline wavy;
}

.adders {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.2rem;
    border-top: 1px solid #d9cbb6;
    padding-top: 0.45rem;
}

.adders select {
    border: none;
    border-bottom: 1px solid #d9cbb6;
    background: transparent;
    color: #5a4032;
    font: inherit;
    font-size: 0.85rem;
    padding: 0;
    cursor: pointer;
}

.hint {
    margin: 0;
    color: #5a4032;
    font-size: 0.85rem;
}

.slots {
    gap: 0.35rem;
}

.slots h2 {
    margin-bottom: 0.15rem;
}

.slot {
    display: grid;
    grid-template-columns: 6.5rem auto;
    align-items: center;
    gap: 0.6rem;
}

.pips {
    display: flex;
    gap: 0.22rem;
}

.pip {
    width: 0.85rem;
    height: 0.85rem;
    border-radius: 50%;
    border: 1.5px solid #1b120c;
    background: transparent;
    padding: 0;
    cursor: pointer;
}

.pip.on {
    background: #1b120c;
}

.slot input {
    width: 2rem;
    border: none;
    border-bottom: 1px solid #3a2a1e;
    background: transparent;
    font: inherit;
    color: inherit;
    text-align: center;
}

.slot .of {
    color: #5a4032;
    font-size: 0.85rem;
}

.groups {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    border-top: 1px solid #3a2a1e;
    padding-top: 0.6rem;
}

.groups h2 {
    margin-bottom: 0.25rem;
}

.spell {
    display: grid;
    grid-template-columns:
        0.9rem minmax(8rem, 1.4fr) minmax(5rem, 0.8fr) minmax(5rem, 0.8fr) auto auto minmax(4rem, 0.7fr)
        0.8rem;
    gap: 0.35rem;
    align-items: center;
    padding-bottom: 0.1rem;
    border-bottom: 1px solid #e6dac6;
    margin-bottom: 0.2rem;
}

.name {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    padding: 0;
    cursor: pointer;
}

.stat {
    font-size: 0.85rem;
    color: #3a2a1e;
}

.source {
    font-size: 0.75rem;
    color: #5a4032;
    text-align: right;
}

.always {
    font-size: 0.65rem;
    text-align: center;
}

input[type="checkbox"] {
    appearance: none;
    width: 0.8rem;
    height: 0.8rem;
    margin: 0;
    border: 1.5px solid #1b120c;
    background: transparent;
    display: grid;
    place-content: center;
    cursor: pointer;
}

input[type="checkbox"]:checked::after {
    content: "";
    width: 0.42rem;
    height: 0.42rem;
    background: #1b120c;
}

.mark {
    width: 1.1rem;
    height: 1.1rem;
    display: grid;
    place-content: center;
    border-radius: 2px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #cbbba4;
}

.mark.on {
    background: #1b120c;
    color: #f4ead8;
}

.remove {
    border: none;
    background: transparent;
    color: #5a4032;
    font: inherit;
    cursor: pointer;
    padding: 0;
}

.description {
    margin: 0 0 0.5rem 1.25rem;
    font-size: 0.85rem;
    line-height: 1.35;
}

.description p {
    margin: 0 0 0.35rem;
    white-space: pre-line;
}

.rule {
    color: inherit;
    text-decoration: underline dotted;
    text-underline-offset: 0.15rem;
}

.rule.missing {
    color: #8a2e24;
    text-decoration-style: wavy;
    cursor: help;
}

.spell.missing {
    color: #8a2e24;
    border-bottom-style: dashed;
}

.spell.missing .name {
    font-style: italic;
    cursor: help;
}

.spell.missing .stat,
.spell.missing .source {
    color: #a8776d;
}

.description .summary {
    font-style: italic;
    color: #5a4032;
}

input:focus,
select:focus,
button:focus-visible {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}
</style>
