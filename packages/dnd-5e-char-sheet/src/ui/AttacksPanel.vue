<script setup lang="ts">
import type { Attack, CompendiumRef, EvaluatedAttack } from "@planarally/system-dnd-5e-srd";
import { computed, onBeforeUnmount, reactive, ref } from "vue";

import { api } from "../context";

import type { SheetStats } from "./data";
import { ROLL_HINT, roll, rollD20 } from "./rolls";
import { commitNumber, createId, signed } from "./sheet";

const props = defineProps<{ stats: SheetStats | undefined }>();
const attacks = defineModel<Attack[]>("attacks", { required: true });

interface Row {
    id: string;
    // Undefined until a new attack is saved and evaluated
    evaluated: EvaluatedAttack | undefined;
    stored: Attack | undefined;
}

// Manual rows come from the edited attacks, so they show edits before they are saved
const rows = computed((): Row[] => {
    const evaluated = props.stats?.attacks ?? [];
    const manual = new Map(evaluated.filter((attack) => attack.kind === "manual").map((attack) => [attack.id, attack]));
    return [
        ...evaluated
            .filter((attack) => attack.kind === "weapon")
            .map((attack) => ({ id: attack.id, evaluated: attack, stored: undefined })),
        ...attacks.value.map((attack) => ({ id: attack.id, evaluated: manual.get(attack.id), stored: attack })),
    ];
});

const open = reactive(new Set<string>());

function toggle(id: string): void {
    if (!open.delete(id)) open.add(id);
}

function nameOf(row: Row): string {
    const name = row.stored?.name ?? row.evaluated?.name ?? "";
    return name.trim().length > 0 ? name : "Unnamed attack";
}

function abilityText(id: string | undefined): string {
    const ability = props.stats?.abilities.find((ability) => ability.id === id);
    return ability === undefined ? "—" : ability.abbreviation.toUpperCase();
}

function hitText(attack: EvaluatedAttack | undefined): string {
    if (attack === undefined) return "…";
    return attack.attackBonus === undefined ? "?" : signed(attack.attackBonus);
}

// e.g. "1d8 + 3 slashing"
function damageText(attack: EvaluatedAttack): string {
    const bonus = attack.damageBonus;
    const parts = [attack.damageDice ?? ""];
    if (bonus === undefined) parts.push("+ ?");
    else if (bonus !== 0) parts.push(`${bonus < 0 ? "−" : "+"} ${Math.abs(bonus)}`);
    parts.push(attack.damageType ?? "");
    return parts.filter((part) => part.length > 0).join(" ");
}

interface Tag {
    text: string;
    // The weapon property rule it names
    ref: CompendiumRef | undefined;
}

// Manual tags that name a weapon property link to it as well
function tagsOf(row: Row): Tag[] {
    const attack = row.evaluated;
    const refs = props.stats?.propertyRefs;
    const tags = (row.stored?.tags ?? attack?.tags ?? []).map((text) => ({
        text,
        ref: refs?.get(text.toLowerCase()),
    }));
    if (attack?.distance !== undefined) {
        tags.push({ text: `${attack.distance.normal}/${attack.distance.long} ft`, ref: refs?.get("range") });
    }
    return tags;
}

function openTag(ref: CompendiumRef, event: MouseEvent): void {
    api.compendium.openRuleAt(ref, event.clientX, event.clientY);
}

function label(row: Row, roll: string): string {
    return `${nameOf(row)} ${roll}`;
}

function add(): void {
    const id = createId();
    attacks.value.push({
        id,
        name: "",
        ability: "",
        proficient: true,
        attackBonus: 0,
        damage: "",
        damageAbility: true,
        damageBonus: 0,
        damageType: "",
        tags: [],
    });
    open.add(id);
}

const CONFIRM_DELAY = 3000;
const confirming = ref<string>();
let confirmTimer: ReturnType<typeof setTimeout> | undefined;

function cancelRemove(id?: string): void {
    if (id !== undefined && confirming.value !== id) return;
    clearTimeout(confirmTimer);
    confirming.value = undefined;
}

// The first click only asks, as the button sits next to the edit toggle
function requestRemove(id: string): void {
    if (confirming.value !== id) {
        cancelRemove();
        confirming.value = id;
        confirmTimer = setTimeout(cancelRemove, CONFIRM_DELAY);
        return;
    }
    cancelRemove();
    attacks.value = attacks.value.filter((attack) => attack.id !== id);
    open.delete(id);
}

onBeforeUnmount(() => clearTimeout(confirmTimer));

function setNumber(event: Event, fallback: number, apply: (value: number) => void): void {
    const input = event.target as HTMLInputElement;
    const value = commitNumber(input.value, fallback);
    apply(value);
    input.value = String(value);
}

function setTags(attack: Attack, event: Event): void {
    const input = event.target as HTMLInputElement;
    attack.tags = input.value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    input.value = attack.tags.join(", ");
}
</script>

<template>
    <div class="attacks-panel">
        <div class="attack-head">
            <span>Name</span>
            <span>Stat</span>
            <span>Hit</span>
            <span>Damage</span>
            <span></span>
        </div>
        <div class="attack-list">
            <template v-for="row in rows" :key="row.id">
                <div class="attack-row">
                    <span class="attack-name">
                        <button
                            v-if="row.stored"
                            type="button"
                            class="name-button"
                            :class="{ unproficient: !row.stored.proficient }"
                            :aria-expanded="open.has(row.id)"
                            @click="toggle(row.id)"
                        >
                            {{ nameOf(row) }}
                        </button>
                        <span v-else :class="{ unproficient: row.evaluated?.proficient === false }">
                            {{ nameOf(row) }}
                        </span>
                        <span v-if="tagsOf(row).length > 0" class="attack-tags">
                            <template v-for="(tag, index) in tagsOf(row)" :key="tag.text">
                                <template v-if="index > 0"> · </template>
                                <button
                                    v-if="tag.ref"
                                    type="button"
                                    class="rule-link"
                                    @click="openTag(tag.ref, $event)"
                                >
                                    {{ tag.text }}
                                </button>
                                <template v-else>{{ tag.text }}</template>
                            </template>
                        </span>
                    </span>
                    <span class="stat">{{ abilityText(row.evaluated?.ability) }}</span>
                    <button
                        type="button"
                        class="rollable"
                        :title="row.evaluated?.proficient === false ? `Not proficient · ${ROLL_HINT}` : ROLL_HINT"
                        :disabled="row.evaluated === undefined"
                        @click="row.evaluated && rollD20(row.evaluated.attack, label(row, 'attack'), $event)"
                    >
                        {{ hitText(row.evaluated) }}
                    </button>
                    <span class="attack-damage">
                        <button
                            v-if="row.evaluated?.damage"
                            type="button"
                            class="rollable"
                            title="Click to roll damage"
                            @click="roll(row.evaluated.damage, label(row, 'damage'))"
                        >
                            {{ damageText(row.evaluated) }}
                        </button>
                        <span v-else>—</span>
                        <button
                            v-if="row.evaluated?.versatileDamage"
                            type="button"
                            class="rollable"
                            title="Two-handed damage"
                            @click="roll(row.evaluated.versatileDamage, label(row, 'two-handed damage'))"
                        >
                            (2H)
                        </button>
                    </span>
                    <span v-if="row.stored" class="actions">
                        <button
                            v-if="confirming !== row.id"
                            type="button"
                            :aria-label="open.has(row.id) ? 'Close attack' : 'Edit attack'"
                            @click="toggle(row.id)"
                        >
                            {{ open.has(row.id) ? "▴" : "▾" }}
                        </button>
                        <button
                            type="button"
                            :class="{ confirm: confirming === row.id }"
                            :aria-label="confirming === row.id ? 'Confirm removing the attack' : 'Remove attack'"
                            @click="requestRemove(row.id)"
                            @blur="cancelRemove(row.id)"
                        >
                            {{ confirming === row.id ? "Remove?" : "×" }}
                        </button>
                    </span>
                    <span v-else></span>
                </div>
                <div v-if="row.stored && open.has(row.id)" class="attack-editor">
                    <label class="wide">
                        <span>Name</span>
                        <input v-model="row.stored.name" autocomplete="off" />
                    </label>
                    <label>
                        <span>Stat</span>
                        <select v-model="row.stored.ability">
                            <option value="">None</option>
                            <option v-for="ability in stats?.abilities ?? []" :key="ability.id" :value="ability.id">
                                {{ ability.name }}
                            </option>
                        </select>
                    </label>
                    <label class="check">
                        <input v-model="row.stored.proficient" type="checkbox" />
                        <span>Proficient</span>
                    </label>
                    <label>
                        <span>Attack bonus</span>
                        <input
                            :value="row.stored.attackBonus"
                            inputmode="numeric"
                            autocomplete="off"
                            @change="
                                setNumber($event, row.stored.attackBonus, (value) => (row.stored!.attackBonus = value))
                            "
                        />
                    </label>
                    <label>
                        <span>Damage dice</span>
                        <input v-model="row.stored.damage" placeholder="1d8" autocomplete="off" />
                    </label>
                    <label class="check">
                        <input v-model="row.stored.damageAbility" type="checkbox" />
                        <span>Add stat to damage</span>
                    </label>
                    <label>
                        <span>Damage bonus</span>
                        <input
                            :value="row.stored.damageBonus"
                            inputmode="numeric"
                            autocomplete="off"
                            @change="
                                setNumber($event, row.stored.damageBonus, (value) => (row.stored!.damageBonus = value))
                            "
                        />
                    </label>
                    <label>
                        <span>Damage type</span>
                        <input v-model="row.stored.damageType" placeholder="slashing" autocomplete="off" />
                    </label>
                    <label class="wide">
                        <span>Tags, comma separated</span>
                        <input
                            :value="row.stored.tags.join(', ')"
                            placeholder="reach, magical"
                            autocomplete="off"
                            @change="setTags(row.stored, $event)"
                        />
                    </label>
                </div>
            </template>
        </div>
        <button type="button" class="text-button" @click="add">Add attack</button>
    </div>
</template>

<style scoped>
.attacks-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

button {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 0;
    cursor: pointer;
}

button:disabled {
    cursor: default;
}

button:focus-visible,
input:focus,
select:focus {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

.attack-head,
.attack-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 2.2rem 2.4rem minmax(0, 1.3fr) 2rem;
    gap: 0.35rem;
    align-items: center;
}

.attack-head {
    font-size: 0.62rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5a4032;
    font-weight: 700;
}

.attack-list {
    overflow: auto;
    min-height: 0;
}

.attack-row {
    padding: 0.1rem 0;
    border-bottom: 1px solid #e6dac8;
}

.attack-name {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.attack-name > :first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
}

.attack-tags {
    font-size: 0.7rem;
    color: #5a4032;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.rule-link {
    text-decoration: underline dotted;
    text-underline-offset: 0.12rem;
}

.rule-link:hover {
    color: #8a5a2a;
}

.unproficient {
    color: #8a2e24;
}

.stat {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #5a4032;
}

.attack-damage {
    display: flex;
    gap: 0.3rem;
    min-width: 0;
}

.rollable:not(:disabled):hover,
.name-button:hover {
    color: #8a5a2a;
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.4rem;
    color: #5a4032;
    white-space: nowrap;
}

.actions .confirm {
    color: #8a2e24;
    font-size: 0.75rem;
    font-weight: 700;
}

.attack-editor {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.25rem 0.5rem;
    padding: 0.3rem 0 0.4rem 0.5rem;
    border-bottom: 1px solid #e6dac8;
    font-size: 0.85rem;
}

.attack-editor label {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.attack-editor label > span {
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5a4032;
    font-weight: 700;
}

.attack-editor .wide {
    grid-column: 1 / -1;
}

.attack-editor .check {
    flex-direction: row;
    align-items: center;
    gap: 0.3rem;
}

.attack-editor .check > span {
    font-size: 0.75rem;
    letter-spacing: normal;
    text-transform: none;
    font-weight: normal;
}

.attack-editor input:not([type="checkbox"]),
.attack-editor select {
    border: none;
    border-bottom: 1px solid #d9cbb6;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 0;
    min-width: 0;
}

.text-button {
    align-self: flex-start;
    margin-top: 0.25rem;
    color: #5a4032;
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}
</style>
