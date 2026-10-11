<script setup lang="ts">
import type {
    EvaluatedEquipmentGrant,
    EvaluatedStartingEquipment,
    StartingEquipmentPick,
} from "@planarally/system-dnd-5e-srd";
import { computed, reactive, watch } from "vue";

import { addOpenedStartingEquipment } from "./data";

const props = defineProps<{ equipment: EvaluatedStartingEquipment }>();

type Line = EvaluatedStartingEquipment["lines"][number];
type FromGrant = Extract<EvaluatedEquipmentGrant, { kind: "from" }>;

const picks = reactive<StartingEquipmentPick[]>([]);

// The equipment is evaluated anew on every change, so only another source or line count starts over
watch(
    () => `${props.equipment.source.kind}/${props.equipment.source.id}/${props.equipment.lines.length}`,
    () => picks.splice(0, picks.length, ...props.equipment.lines.map(() => ({ option: 0, from: [] }))),
    { immediate: true },
);

function letter(index: number): string {
    return String.fromCharCode(97 + index);
}

function grantText(grant: EvaluatedEquipmentGrant): string {
    if (grant.kind === "coins") return `${grant.amount} ${grant.unit}`;
    const quantity = grant.quantity > 1 ? `${grant.quantity} × ` : "";
    if (grant.kind === "from") return `${quantity}one of your choice`;
    return `${quantity}${grant.name}`;
}

function optionText(option: readonly EvaluatedEquipmentGrant[]): string {
    return option.map(grantText).join(", ");
}

function chosenFrom(line: Line, index: number): FromGrant[] {
    const option = line.options[picks[index]?.option ?? 0] ?? [];
    return option.filter((grant): grant is FromGrant => grant.kind === "from");
}

function pickOption(index: number, option: number): void {
    picks[index] = { option, from: [] };
}

function pickFrom(index: number, slot: number, event: Event): void {
    const pick = picks[index];
    if (pick !== undefined) pick.from[slot] = (event.target as HTMLSelectElement).value;
}

const complete = computed(() =>
    props.equipment.lines.every((line, index) =>
        chosenFrom(line, index).every((_, slot) => (picks[index]?.from[slot] ?? "").length > 0),
    ),
);

function add(): void {
    if (complete.value) addOpenedStartingEquipment(props.equipment.source, picks);
}
</script>

<template>
    <details class="starting" open>
        <summary>{{ equipment.source.name }} starting equipment</summary>
        <div v-for="(line, index) in equipment.lines" :key="index" class="line">
            <template v-if="line.options.length > 1">
                <label v-for="(option, optionIndex) in line.options" :key="optionIndex" class="option">
                    <input
                        type="radio"
                        :name="`${equipment.source.kind}-${equipment.source.id}-${index}`"
                        :checked="picks[index]?.option === optionIndex"
                        @change="pickOption(index, optionIndex)"
                    />
                    ({{ letter(optionIndex) }}) {{ optionText(option) }}
                </label>
            </template>
            <span v-else class="option">{{ optionText(line.options[0] ?? []) }}</span>
            <select
                v-for="(grant, slot) in chosenFrom(line, index)"
                :key="`${picks[index]?.option}-${slot}`"
                :value="picks[index]?.from[slot] ?? ''"
                aria-label="Pick an item"
                @change="pickFrom(index, slot, $event)"
            >
                <option value="" disabled>Pick…</option>
                <option v-for="choice in grant.options" :key="choice.id" :value="choice.id">{{ choice.name }}</option>
            </select>
        </div>
        <button type="button" class="add" :disabled="!complete" @click="add">Add to inventory</button>
    </details>
</template>

<style scoped>
.starting {
    margin-bottom: 0.3rem;
    font-size: 0.85rem;
}

.starting summary {
    cursor: pointer;
}

.line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.1rem 0.6rem;
    padding: 0.15rem 0 0.15rem 0.6rem;
    border-bottom: 1px solid #e6dac8;
}

.option {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
}

select {
    border: none;
    border-bottom: 1px solid #d9cbb6;
    background: transparent;
    color: inherit;
    font: inherit;
}

.add {
    margin-top: 0.25rem;
    border: none;
    background: transparent;
    color: #5a4032;
    font: inherit;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}

.add:disabled {
    cursor: default;
    opacity: 0.5;
}
</style>
