<script setup lang="ts">
import type { CoinUnit, CompendiumRef, EvaluatedItem } from "@planarally/system-dnd-5e-srd";
import { computed, reactive, ref, useId } from "vue";

import { api } from "../context";

import { addOpenedItem, removeOpenedItem, setOpenedCoins, updateOpenedItem, type SheetStats } from "./data";
import { commitNumber, signed } from "./sheet";
import StartingEquipmentPicker from "./StartingEquipmentPicker.vue";

const props = defineProps<{ stats: SheetStats | undefined }>();

const COINS: readonly CoinUnit[] = ["cp", "sp", "ep", "gp", "pp"];
const GEAR_KINDS = { gear: "Gear", tool: "Tool", ammunition: "Ammunition", pack: "Pack" } as const;

const items = computed(() => props.stats?.items ?? []);
const pendingStarting = computed(() => (props.stats?.startingEquipment ?? []).filter((equipment) => !equipment.added));
const overloaded = computed(() => {
    const capacity = props.stats?.carryingCapacity;
    return capacity !== undefined && (props.stats?.carriedWeight ?? 0) > capacity;
});
const open = reactive(new Set<string>());
const listId = useId();
const newItem = ref("");
const newQuantity = ref(1);

function toggle(id: string): void {
    if (!open.delete(id)) open.add(id);
}

function capitalized(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function equippable(item: EvaluatedItem): boolean {
    return item.data?.type === "weapon" || item.data?.type === "armor";
}

function kindOf(item: EvaluatedItem): string {
    const data = item.data;
    if (data === undefined) return "Custom";
    if (data.type === "weapon") return `${capitalized(data.category)} ${data.range}`;
    if (data.type === "armor") return data.category === "shield" ? "Shield" : `${capitalized(data.category)} armor`;
    return GEAR_KINDS[data.type];
}

// e.g. "1d8 slashing (1d10)" or "AC 12 + Dex (max 2)"
function summaryOf(item: EvaluatedItem): string {
    const data = item.data;
    if (data?.type === "weapon") {
        if (data.damage === undefined) return "";
        const versatile = data.versatile === undefined ? "" : ` (${data.versatile})`;
        return `${data.damage} ${data.damageType ?? ""}${versatile}`;
    }
    if (data?.type === "armor") {
        const armorClass = data.armorClass + item.bonus;
        if (data.category === "shield") return `AC ${signed(armorClass)}`;
        if (data.dexterityCap === 0) return `AC ${armorClass}`;
        if (data.dexterityCap === undefined) return `AC ${armorClass} + Dex`;
        return `AC ${armorClass} + Dex (max ${data.dexterityCap})`;
    }
    return "";
}

function pounds(value: number): string {
    return `${Math.round(value * 100) / 100} lb`;
}

function weightText(item: EvaluatedItem): string {
    return item.unitWeight === 0 ? "—" : pounds(item.unitWeight * item.quantity);
}

interface Tag {
    text: string;
    // The rule it names
    ref?: CompendiumRef;
    warn?: boolean;
}

function tags(item: EvaluatedItem): Tag[] {
    const tags: Tag[] = [];
    if (item.proficient === false) tags.push({ text: "Not proficient", warn: true });
    const data = item.data;
    if (data?.type === "armor") {
        if (data.strength !== undefined) tags.push({ text: `Str ${data.strength}` });
        if (data.stealthDisadvantage) tags.push({ text: "Stealth disadvantage" });
    }
    if (data?.type === "weapon") {
        const refs = props.stats?.propertyRefs;
        tags.push(...data.properties.map((property) => ({ text: property, ref: refs?.get(property) })));
        if (data.distance !== undefined) {
            tags.push({ text: `${data.distance.normal}/${data.distance.long} ft`, ref: refs?.get("range") });
        }
    }
    return tags;
}

function openTag(ref: CompendiumRef, event: MouseEvent): void {
    api.compendium.openRuleAt(ref, event.clientX, event.clientY);
}

function numberFrom(event: Event, fallback: number): number {
    return commitNumber((event.target as HTMLInputElement).value, fallback);
}

function setCoin(unit: CoinUnit, event: Event): void {
    const current = props.stats?.coins[unit] ?? 0;
    const value = Math.max(numberFrom(event, current), 0);
    (event.target as HTMLInputElement).value = String(value);
    setOpenedCoins({ [unit]: value });
}

function setQuantity(item: EvaluatedItem, event: Event): void {
    const value = Math.max(numberFrom(event, item.quantity), 0);
    (event.target as HTMLInputElement).value = String(value);
    updateOpenedItem(item.id, { quantity: value });
}

function setBonus(item: EvaluatedItem, event: Event): void {
    updateOpenedItem(item.id, { bonus: numberFrom(event, item.bonus) });
}

function setWeight(item: EvaluatedItem, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) updateOpenedItem(item.id, { weight: Math.max(value, 0) });
}

// Notes save when the field loses focus; saving while typing would let the stored text overwrite newer keystrokes
const drafts = reactive(new Map<string, string>());

function notesOf(item: EvaluatedItem): string {
    return drafts.get(item.id) ?? item.notes;
}

function setNotes(item: EvaluatedItem, event: Event): void {
    updateOpenedItem(item.id, { notes: (event.target as HTMLTextAreaElement).value });
    drafts.delete(item.id);
}

function itemRef(item: EvaluatedItem): CompendiumRef | undefined {
    return item.item === undefined ? undefined : props.stats?.itemRefs.get(item.item);
}

function openRule(item: EvaluatedItem, event: MouseEvent): void {
    const ref = itemRef(item);
    if (ref !== undefined) api.compendium.openRuleAt(ref, event.clientX, event.clientY);
}

// A compendium item by name, anything else as an item outside the compendium
function add(): void {
    const name = newItem.value.trim();
    if (name.length === 0) return;
    const quantity = Math.max(Math.round(newQuantity.value) || 1, 1);
    const option = props.stats?.itemOptions.find((option) => option.name.toLowerCase() === name.toLowerCase());
    addOpenedItem(option === undefined ? { name, quantity } : { item: option.id, quantity });
    newItem.value = "";
    newQuantity.value = 1;
}
</script>

<template>
    <div class="page">
        <section class="panel inventory">
            <h2>Inventory</h2>
            <div class="item-head">
                <span></span>
                <span>Name</span>
                <span>Kind</span>
                <span>Stats</span>
                <span>Qty</span>
                <span>Weight</span>
                <span></span>
            </div>
            <div class="item-list">
                <p v-if="items.length === 0" class="empty-list">Nothing carried yet.</p>
                <div v-for="item in items" :key="item.id" class="item">
                    <div class="item-row" :class="{ empty: item.quantity === 0 }">
                        <input
                            v-if="equippable(item)"
                            type="checkbox"
                            :checked="item.equipped"
                            :aria-label="`Equip ${item.name}`"
                            title="Equipped"
                            @change="updateOpenedItem(item.id, { equipped: !item.equipped })"
                        />
                        <span v-else></span>
                        <span class="name-cell">
                            <button
                                type="button"
                                class="item-name"
                                :class="{ warn: item.proficient === false }"
                                :aria-expanded="open.has(item.id)"
                                @click="toggle(item.id)"
                            >
                                {{ item.name }}<template v-if="item.bonus !== 0"> {{ signed(item.bonus) }}</template>
                            </button>
                            <span
                                v-if="notesOf(item).trim().length > 0"
                                class="has-notes"
                                :title="notesOf(item)"
                                aria-label="Has notes"
                                @click="toggle(item.id)"
                            >
                                ✎
                            </span>
                        </span>
                        <span class="muted">{{ kindOf(item) }}</span>
                        <span class="muted">{{ summaryOf(item) }}</span>
                        <input
                            class="quantity"
                            :value="item.quantity"
                            inputmode="numeric"
                            autocomplete="off"
                            :aria-label="`${item.name} quantity`"
                            @change="setQuantity(item, $event)"
                        />
                        <span class="weight">{{ weightText(item) }}</span>
                        <button
                            type="button"
                            class="remove"
                            aria-label="Remove item"
                            @click="removeOpenedItem(item.id)"
                        >
                            ×
                        </button>
                    </div>
                    <div v-if="open.has(item.id)" class="item-details">
                        <div class="item-meta">
                            <button v-if="itemRef(item)" type="button" class="link" @click="openRule(item, $event)">
                                Rules
                            </button>
                            <template v-for="tag in tags(item)" :key="tag.text">
                                <button
                                    v-if="tag.ref"
                                    type="button"
                                    class="rule-link"
                                    @click="openTag(tag.ref, $event)"
                                >
                                    {{ tag.text }}
                                </button>
                                <span v-else :class="{ warn: tag.warn }">{{ tag.text }}</span>
                            </template>
                            <label v-if="equippable(item)">
                                Magic bonus
                                <input
                                    class="small"
                                    :value="item.bonus"
                                    inputmode="numeric"
                                    autocomplete="off"
                                    @change="setBonus(item, $event)"
                                />
                            </label>
                            <label v-if="item.data === undefined">
                                Weight (lb)
                                <input
                                    class="small"
                                    :value="item.weight ?? 0"
                                    inputmode="decimal"
                                    autocomplete="off"
                                    @change="setWeight(item, $event)"
                                />
                            </label>
                        </div>
                        <textarea
                            :value="notesOf(item)"
                            rows="2"
                            placeholder="Notes"
                            :aria-label="`${item.name} notes`"
                            @input="drafts.set(item.id, ($event.target as HTMLTextAreaElement).value)"
                            @change="setNotes(item, $event)"
                        ></textarea>
                    </div>
                </div>
            </div>
            <form class="add-item" @submit.prevent="add">
                <input v-model="newItem" :list="listId" placeholder="Add item…" aria-label="Item" autocomplete="off" />
                <input v-model.number="newQuantity" class="quantity" inputmode="numeric" aria-label="Quantity" />
                <button type="submit" class="link">Add</button>
                <datalist :id="listId">
                    <option v-for="option in stats?.itemOptions ?? []" :key="option.id" :value="option.name" />
                </datalist>
            </form>
        </section>

        <section class="col">
            <div class="panel">
                <h2>Coins</h2>
                <div class="coins">
                    <label v-for="unit in COINS" :key="unit" class="coin">
                        <input
                            :value="stats?.coins[unit] ?? 0"
                            inputmode="numeric"
                            autocomplete="off"
                            :aria-label="unit"
                            @change="setCoin(unit, $event)"
                        />
                        <span>{{ unit }}</span>
                    </label>
                </div>
                <div class="carrying" :class="{ warn: overloaded }">
                    Carrying {{ pounds(stats?.carriedWeight ?? 0) }}
                    <template v-if="stats?.carryingCapacity !== undefined">
                        of {{ pounds(stats.carryingCapacity) }}
                    </template>
                </div>
            </div>
            <div v-if="pendingStarting.length > 0" class="panel">
                <h2>Starting equipment</h2>
                <StartingEquipmentPicker
                    v-for="equipment in pendingStarting"
                    :key="`${equipment.source.kind}/${equipment.source.id}`"
                    :equipment="equipment"
                />
            </div>
        </section>
    </div>
</template>

<style scoped>
.page {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 19rem;
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

.panel {
    border: 1px solid #3a2a1e;
    background: rgba(255, 252, 245, 0.35);
    padding: 0.3rem 0.45rem 0.4rem;
    min-height: 0;
}

.panel h2,
.item-head {
    margin: 0 0 0.2rem;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5a4032;
    font-weight: 700;
}

input,
textarea {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 0;
    min-width: 0;
}

input:focus,
textarea:focus,
button:focus-visible {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

button {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 0;
    cursor: pointer;
}

.inventory {
    display: flex;
    flex-direction: column;
}

.item-head,
.item-row {
    display: grid;
    grid-template-columns: 0.9rem minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 1.2fr) 2.4rem 3.6rem 1rem;
    gap: 0.4rem;
    align-items: center;
}

.item-head {
    margin: 0;
}

.item-list {
    flex: 1;
    overflow: auto;
    min-height: 0;
}

.empty-list {
    margin: 0.4rem 0;
    color: #5a4032;
    font-style: italic;
}

.item-row {
    padding: 0.1rem 0;
    border-bottom: 1px solid #e6dac8;
}

.item-row.empty .item-name,
.item-row.empty .muted,
.item-row.empty .weight {
    opacity: 0.5;
}

.name-cell {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
    min-width: 0;
}

.item-name {
    min-width: 0;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.has-notes {
    flex: none;
    font-size: 0.75rem;
    color: #8a5a2a;
    cursor: help;
}

.item-name:hover {
    color: #8a5a2a;
}

.muted {
    color: #5a4032;
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.warn {
    color: #8a2e24;
}

.quantity {
    text-align: right;
    border-bottom: 1px solid #d9cbb6;
}

.weight {
    text-align: right;
    color: #5a4032;
    font-size: 0.8rem;
}

.remove {
    color: #5a4032;
}

.item-details {
    padding: 0.2rem 0 0.35rem 1.3rem;
    border-bottom: 1px solid #e6dac8;
}

.item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.15rem 0.7rem;
    color: #5a4032;
    font-size: 0.8rem;
}

.item-meta label {
    display: inline-flex;
    gap: 0.25rem;
}

.small {
    width: 2.5rem;
    border-bottom: 1px solid #d9cbb6;
}

.item-details textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    margin-top: 0.2rem;
    border-bottom: 1px solid #e6dac8;
}

.rule-link {
    color: #5a4032;
    text-decoration: underline dotted;
    text-underline-offset: 0.15rem;
}

.rule-link:hover {
    color: #8a5a2a;
}

.link {
    color: #5a4032;
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}

.add-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 2.4rem auto;
    gap: 0.4rem;
    align-items: center;
    margin-top: 0.35rem;
}

.add-item input:first-child {
    border-bottom: 1px solid #d9cbb6;
}

.coins {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.3rem;
}

.coin {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid #d9cbb6;
    padding: 0.05rem 0.2rem;
}

.coin input {
    width: 100%;
    text-align: center;
}

.coin span {
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5a4032;
    font-weight: 700;
}

.carrying {
    margin-top: 0.35rem;
    color: #5a4032;
    font-size: 0.8rem;
}

.carrying.warn {
    color: #8a2e24;
}
</style>
