<script setup lang="ts">
import type { Characteristic } from "@planarally/system-dnd-5e-srd";

import { setOpenedCharacteristic } from "./data";

const props = defineProps<{
    label: string;
    characteristic: Characteristic;
    text: string;
    // The background table, in die order
    suggestions: readonly string[];
    rows: number;
    disabled: boolean;
}>();

function commit(event: Event): void {
    setOpenedCharacteristic(props.characteristic, (event.target as HTMLTextAreaElement).value);
}

// Suggestions are added on a new line, so nothing typed is lost
function append(suggestion: string): void {
    const current = props.text.trimEnd();
    setOpenedCharacteristic(props.characteristic, current.length === 0 ? suggestion : `${current}\n${suggestion}`);
}

function pick(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const index = Number(select.value);
    select.value = "";
    const suggestion = props.suggestions[index];
    if (suggestion !== undefined) append(suggestion);
}

function roll(): void {
    const suggestion = props.suggestions[Math.floor(Math.random() * props.suggestions.length)];
    if (suggestion !== undefined) append(suggestion);
}
</script>

<template>
    <div class="panel note">
        <div class="note-head">
            <h2>{{ label }}</h2>
            <template v-if="suggestions.length > 0 && !disabled">
                <select :aria-label="`Suggest ${label.toLowerCase()}`" @change="pick">
                    <option value="">Suggest…</option>
                    <option v-for="(suggestion, index) in suggestions" :key="index" :value="index" :title="suggestion">
                        {{ index + 1 }}. {{ suggestion }}
                    </option>
                </select>
                <button type="button" :title="`Roll a random ${label.toLowerCase()} entry`" @click="roll">
                    d{{ suggestions.length }}
                </button>
            </template>
        </div>
        <textarea :value="text" :rows="rows" :disabled="disabled" :aria-label="label" @change="commit"></textarea>
    </div>
</template>

<style scoped>
.note-head {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
}

h2 {
    flex: 1;
    margin: 0 0 0.2rem;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5a4032;
    font-weight: 700;
}

textarea {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 0;
    width: 100%;
    box-sizing: border-box;
    resize: none;
}

textarea:focus {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

select,
button {
    border: none;
    background: transparent;
    color: #5a4032;
    font: inherit;
    font-size: 0.72rem;
    padding: 0;
    cursor: pointer;
    max-width: 5.5rem;
}

button {
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}
</style>
