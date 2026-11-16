<script setup lang="ts">
import { computed, ref } from "vue";

import { commitBonus, signed } from "./sheet";

const props = withDefaults(
    defineProps<{ computedValue: number; label: string; signed?: boolean; parts?: readonly string[] }>(),
    { signed: true, parts: () => [] },
);

const bonus = defineModel<number>({ required: true });
const tip = ref<HTMLElement | null>(null);

const shown = computed(() => props.computedValue + bonus.value);

const breakdown = computed(() => {
    const pieces = [...props.parts];
    if (bonus.value !== 0) pieces.push(`bonus ${signed(bonus.value)}`);
    return pieces.join(" · ");
});

function display(value: number): string {
    return props.signed ? signed(value) : String(value);
}

function onFocus(event: FocusEvent): void {
    const el = tip.value;
    if (!el || breakdown.value.length === 0) return;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    el.style.top = `${rect.bottom + 4}px`;
    el.style.left = `${rect.left}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.margin = "0";
    if (!el.matches(":popover-open")) el.showPopover();
}

function onBlur(): void {
    if (tip.value?.matches(":popover-open")) tip.value.hidePopover();
}

function onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = commitBonus(input.value, props.computedValue);
    if (next === null) {
        input.value = display(shown.value);
        return;
    }
    bonus.value = next;
    input.value = display(props.computedValue + next);
}
</script>

<template>
    <span class="stat">
        <input
            class="stat-input"
            :class="{ adjusted: bonus !== 0 }"
            inputmode="numeric"
            autocomplete="off"
            :aria-label="label"
            :aria-description="breakdown || undefined"
            :value="display(shown)"
            @focus="onFocus"
            @blur="onBlur"
            @change="onChange"
        />
        <span ref="tip" popover="manual" class="breakdown">{{ breakdown }}</span>
    </span>
</template>

<style scoped>
.stat {
    display: block;
    min-width: 0;
    width: 100%;
}

.stat-input {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: center;
    width: 100%;
    padding: 0;
}

.stat-input.adjusted {
    text-decoration: underline dotted #8a5a2a;
    text-underline-offset: 0.18rem;
}

.stat-input:focus {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

.breakdown {
    position: fixed;
    width: max-content;
    max-width: 18rem;
    background: #fffaf2;
    border: 1px solid #3a2a1e;
    color: #1b120c;
    font-size: 0.72rem;
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
    line-height: 1.35;
    padding: 0.15rem 0.4rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    pointer-events: none;
}
</style>
