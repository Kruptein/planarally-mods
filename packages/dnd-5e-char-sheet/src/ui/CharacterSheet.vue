<script setup lang="ts">
import { onMounted, ref } from "vue";

import { openedCharacterSheet } from "../context";

import CharacterPage from "./CharacterPage.vue";
import { useOpenedSheetCharacter, useOpenedStats } from "./data";
import EquipmentPage from "./EquipmentPage.vue";
import LorePage from "./LorePage.vue";
import SpellsPage from "./SpellsPage.vue";

const stats = useOpenedStats();
const character = useOpenedSheetCharacter(stats);
const emit = defineEmits<(e: "close" | "focus") => void>();

function close(): void {
    openedCharacterSheet.value = null;
    emit("close");
}

defineExpose({ close });

const page = ref<"character" | "equipment" | "spells" | "lore">("character");
const pos = ref({ x: 16, y: 16 });

onMounted(() => {
    const width = Math.min(1120, window.innerWidth - 32);
    const height = Math.min(820, window.innerHeight - 32);
    pos.value = {
        x: Math.max(16, (window.innerWidth - width) / 2),
        y: Math.max(16, (window.innerHeight - height) / 2),
    };
});

function onDragStart(event: PointerEvent): void {
    if ((event.target as HTMLElement).closest("button")) return;
    const bar = event.currentTarget as HTMLElement;
    const originX = event.clientX - pos.value.x;
    const originY = event.clientY - pos.value.y;
    bar.setPointerCapture(event.pointerId);

    function onMove(move: PointerEvent): void {
        pos.value = {
            x: Math.max(0, move.clientX - originX),
            y: Math.max(0, move.clientY - originY),
        };
    }

    function onUp(up: PointerEvent): void {
        if (bar.hasPointerCapture(up.pointerId)) bar.releasePointerCapture(up.pointerId);
        bar.removeEventListener("pointermove", onMove);
        bar.removeEventListener("pointerup", onUp);
    }

    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
}
</script>

<template>
    <div class="float" :style="{ left: `${pos.x}px`, top: `${pos.y}px` }" @click.stop="$emit('focus')">
        <div class="frame-bar" @pointerdown="onDragStart">
            <button
                type="button"
                role="tab"
                :aria-selected="page === 'character'"
                :class="{ on: page === 'character' }"
                @click="page = 'character'"
            >
                Character
            </button>
            <button
                type="button"
                role="tab"
                :aria-selected="page === 'equipment'"
                :class="{ on: page === 'equipment' }"
                @click="page = 'equipment'"
            >
                Equipment
            </button>
            <button
                type="button"
                role="tab"
                :aria-selected="page === 'spells'"
                :class="{ on: page === 'spells' }"
                @click="page = 'spells'"
            >
                Spells
            </button>
            <button
                type="button"
                role="tab"
                :aria-selected="page === 'lore'"
                :class="{ on: page === 'lore' }"
                @click="page = 'lore'"
            >
                Lore
            </button>
            <button type="button" class="close" aria-label="Close" @click="close">×</button>
        </div>
        <div class="sheet-body">
            <CharacterPage v-if="page === 'character'" :model-value="character" :stats="stats" class="sheet-page" />
            <EquipmentPage v-else-if="page === 'equipment'" :stats="stats" class="sheet-page" />
            <SpellsPage v-else-if="page === 'spells'" :model-value="character" :stats="stats" class="sheet-page" />
            <LorePage v-else :model-value="character" :stats="stats" class="sheet-page" />
        </div>
    </div>
</template>

<style scoped>
.float {
    position: fixed;
    width: min(1120px, calc(100vw - 32px));
    height: min(820px, calc(100vh - 32px));
    display: flex;
    flex-direction: column;
    background: #f4ead8;
    color: #1b120c;
    border: 1px solid #1a120c;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.38);
    overflow: auto;

    pointer-events: auto;
}

.frame-bar {
    flex: none;
    display: flex;
    gap: 0.25rem;
    padding: 0.35rem 0.45rem;
    background: #2a2118;
    color: #f4ead8;
    cursor: grab;
    user-select: none;
}

.frame-bar:active {
    cursor: grabbing;
}

.frame-bar button {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-family: Palatino, "Palatino Linotype", Georgia, serif;
    padding: 0.2rem 0.75rem;
    cursor: pointer;
}

.frame-bar button.on {
    background: #f4ead8;
    color: #2a2118;
}

.frame-bar .close {
    margin-left: auto;
    padding: 0.1rem 0.55rem;
    font-size: 1.15rem;
    line-height: 1;
}

.sheet-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.sheet-page {
    flex: 1;
    min-height: 0;
}
</style>
