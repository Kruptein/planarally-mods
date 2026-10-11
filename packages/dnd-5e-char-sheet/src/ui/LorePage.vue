<script setup lang="ts">
import { reactive } from "vue";

import CharacteristicNote from "./CharacteristicNote.vue";
import { setOpenedAlignment, type SheetStats } from "./data";
import type { Character } from "./sheet";

// Suggestions only: the field stays free text
const ALIGNMENTS = [
    "Lawful good",
    "Neutral good",
    "Chaotic good",
    "Lawful neutral",
    "Neutral",
    "Chaotic neutral",
    "Lawful evil",
    "Neutral evil",
    "Chaotic evil",
    "Unaligned",
];

const props = defineProps<{ stats: SheetStats | undefined }>();
const model = defineModel<Character>({ required: true });
const character = reactive(model.value);

const characteristicNotes = [
    { characteristic: "personalityTraits", label: "Personality traits", rows: 4 },
    { characteristic: "ideals", label: "Ideals", rows: 3 },
    { characteristic: "bonds", label: "Bonds", rows: 3 },
    { characteristic: "flaws", label: "Flaws", rows: 3 },
] as const;

function setAlignment(event: Event): void {
    const input = event.target as HTMLInputElement;
    setOpenedAlignment(input.value);
    input.value = input.value.trim();
}

function suggestions(characteristic: (typeof characteristicNotes)[number]["characteristic"]): readonly string[] {
    return props.stats?.background.data?.characteristics?.[characteristic] ?? [];
}
</script>

<template>
    <div class="page">
        <section class="col">
            <label class="field">
                <span>Alignment</span>
                <input
                    :value="stats?.alignment ?? ''"
                    :disabled="stats === undefined"
                    list="alignment-options"
                    autocomplete="off"
                    @change="setAlignment"
                />
                <datalist id="alignment-options">
                    <option v-for="alignment in ALIGNMENTS" :key="alignment" :value="alignment" />
                </datalist>
            </label>
            <CharacteristicNote
                v-for="note in characteristicNotes"
                :key="note.characteristic"
                :label="note.label"
                :characteristic="note.characteristic"
                :text="stats?.characteristics[note.characteristic] ?? ''"
                :suggestions="suggestions(note.characteristic)"
                :rows="note.rows"
                :disabled="stats === undefined"
            />
        </section>

        <label class="panel notes">
            <h2>Notes</h2>
            <textarea v-model="character.notes" aria-label="Notes"></textarea>
        </label>
    </div>
</template>

<style scoped>
.page {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: 22rem minmax(0, 1fr);
    gap: 0.7rem;
    padding: 0.7rem 0.75rem 0.8rem;
    box-sizing: border-box;
    color: #1b120c;
    font-family: Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif;
    font-size: 15px;
}

.col {
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    border-bottom: 1px solid #3a2a1e;
}

.field span,
.notes h2 {
    margin: 0;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5a4032;
    font-weight: 700;
}

.field input,
.notes textarea {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 0;
    width: 100%;
    box-sizing: border-box;
}

.field input:focus,
.notes textarea:focus {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

.panel {
    border: 1px solid #3a2a1e;
    background: rgba(255, 252, 245, 0.35);
    padding: 0.3rem 0.45rem 0.4rem;
    min-height: 0;
}

.notes {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.notes textarea {
    flex: 1;
    resize: none;
    line-height: 1.4;
}
</style>
