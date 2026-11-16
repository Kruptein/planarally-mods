<script setup lang="ts">
import { computed } from "vue";

import { isPending, setOpenedChoice, type SheetChoice } from "./data";

const props = defineProps<{
    choice: SheetChoice;
    // Ids that are already known some other way, so picking them would waste the choice
    exclude?: readonly string[];
}>();

const NOUNS: Record<SheetChoice["kind"], [string, string]> = {
    ability: ["ability", "abilities"],
    skill: ["skill", "skills"],
    expertise: ["expertise", "expertise"],
    language: ["language", "languages"],
    armor: ["armor", "armor"],
    weapon: ["weapon", "weapons"],
    tool: ["tool", "tools"],
    option: ["option", "options"],
    spell: ["spell", "spells"],
};

const pending = computed(() => isPending(props.choice));
const noun = computed(() => NOUNS[props.choice.kind][props.choice.count === 1 ? 0 : 1]);
const label = computed(() => {
    const { choice } = props;
    if (choice.kind === "option") return `${choice.source.name}: ${choice.name ?? noun.value}`;
    const amount = choice.amount === undefined ? "" : ` +${choice.amount}`;
    return `${choice.source.name}: ${choice.count} ${noun.value}${amount}`;
});
const available = computed(() =>
    props.choice.options.filter(
        (option) =>
            (props.choice.repeat || !props.choice.picked.some((picked) => picked.id === option.id)) &&
            !props.exclude?.includes(option.id),
    ),
);

function pickedIds(): string[] {
    return props.choice.picked.map((picked) => picked.id);
}

function add(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    select.value = "";
    if (id.length > 0) setOpenedChoice(props.choice, [...pickedIds(), id]);
}

// By position, as a repeatable choice can hold the same option twice
function remove(index: number): void {
    setOpenedChoice(
        props.choice,
        pickedIds().filter((_, i) => i !== index),
    );
}
</script>

<template>
    <div class="choice" :class="{ pending }">
        <span class="choice-label">
            {{ label }}
            <span class="count">{{ choice.picked.length }}/{{ choice.count }}</span>
        </span>
        <span
            v-for="(picked, index) in choice.picked"
            :key="`${index}-${picked.id}`"
            class="chip"
            :title="picked.description"
        >
            {{ picked.name }}
            <button type="button" :aria-label="`Remove ${picked.name}`" @click="remove(index)">×</button>
        </span>
        <select v-if="pending" :aria-label="`Choose ${noun} from ${choice.source.name}`" @change="add">
            <option value="">Choose…</option>
            <option v-for="option in available" :key="option.id" :value="option.id" :title="option.description">
                {{ option.name }}
            </option>
        </select>
    </div>
</template>

<style scoped>
.choice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.2rem 0.45rem;
    margin-bottom: 0.25rem;
}

.choice-label {
    font-size: 0.72rem;
    color: #5a4032;
}

.pending {
    border-left: 2px solid #8a2e24;
    padding-left: 0.3rem;
}

.pending .count {
    color: #8a2e24;
    font-weight: 700;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
}

.chip button,
select {
    border: none;
    background: transparent;
    color: #5a4032;
    font: inherit;
    padding: 0;
    cursor: pointer;
}
</style>
