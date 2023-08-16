<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";

import { api } from "./main";
import { loadedDataBlocks, type CharData, type StatType } from "./data";
import { type DataBlock } from "@planarally/mod-api";

// This is a Vue component that is rendered as a tab in the Shape Edit dialog.
// Our mod uses this to configure a mini character sheet for characters

// Vue and reactivity are outside the scope of the annotated comments
// PA uses Vue as its main UI/reactivity provider and thus also provides mods with the capability to
// provide UI elements in the form of Vue components.

// As mentioned in `./data.ts` we decided to handle the reactivity purely here and not in the dataBlock.
//
// First we declare some things that we're going to interact with reactively:
// - the active dataBlock for the currently selected character
// - an array of stats that represent the rows of our character sheet
// We're wrapping the former only shallowly as there is no point in also tracking the content,
// given that we're tracking that seperately.
// We could have only made the dataBlock reactive, but the ergonomy of dealing with `.get("trackers")` everytime,
// is a bit annoying, hence the extra `stats` ref.

const dataBlock = shallowRef<DataBlock<CharData> | null>(null);
const stats = ref<CharData["data"]>([]);

// Next up, we need to populate the above refs when relevant
// We do this by actively monitoring the character ID of the currently selected shape
// If the active shape is not a character or no shape is selected at all, this will be undefined,
// in which case we want to clear our refs.
// Otherwise, we set our refs with the correct data for the character.

watch(
    () => api.systemsState.characters.reactive.activeCharacterId,
    async (charId) => {
        if (charId === undefined) {
            dataBlock.value = null;
            stats.value = [];
        } else {
            // With the way this is currently written, we're missing one important thing
            // `loadedDataBlocks` is only populated on location load,
            // which means that shapes that have become a character during a session,
            // will not have a dataBlock yet and thus won't have any data to show for it.
            // Ideally we actually handle this case, by calling `loadBlock` here in the `null` case.
            // This is an exercise for the reader ;)
            dataBlock.value = loadedDataBlocks.get(charId) ?? null;
            loadStats();
        }
    },
    // We need to set the `immediate` flag, as the code in this component is only executed once the component is loaded.
    // A watcher is lazy by default, which means that the above code will only execute once the watch condition changes
    // In which case we would miss the case where we just mounted the component with a character already selected.
    // We could handle this with a separate `onMounted`, but we're just duplicating code at that point, so `immediate` it is!
    { immediate: true },
);

function loadStats(): void {
    if (dataBlock.value === null) {
        console.error("Attempt to load stats without dataBlock present");
        return;
    }
    stats.value = dataBlock.value.get("data");
}

// The following two functions handle changes to the character sheet data through the UI
// For text stats, we're using the first function just to demonstrate handling in- and output of the UI manually.
// Whereas for the other types we're using `v-model` to automatically update the data,
// while still using the change event callback to persist the change to the server.

function setStringValue(name: string, value: string): void {
    const db = dataBlock.value;
    if (db === null) return;
    const stat = stats.value.find((s) => s.name === name);
    if (stat === undefined) return;
    stat.value = value;
    db.save();
}

function sync(): void {
    const db = dataBlock.value;
    if (db === null) return;
    db.save();
}

// Handling of adding a new stat

const options = ["Text", "Number", "Checkbox"] as const;
const selectedOption = ref<(typeof options)[number]>(options[0]);
const selectedName = ref("");

function addOption(): void {
    const name = selectedName.value;
    if (name.length === 0 || stats.value.some((s) => s.name === name)) return;

    let stat: StatType;
    if (selectedOption.value === "Checkbox") {
        stat = {
            name,
            type: "check",
            value: false,
        };
    } else if (selectedOption.value === "Number") {
        stat = { name, type: "number", value: 0 };
    } else {
        stat = { name, type: "string", value: "" };
    }
    stats.value.push(stat);
    sync();
}

// Handling removal of a stat
//
// You might notice that we're not doing the simpler operation of
// `data.value = data.value.filter(...)` and calling `sync()`.
// This is because `.filter` is not in place.
// Which means that we're overwriting the `stats` array pointer with a new pointer.
// This makes the `stats.value` pointer and the `dataBlock.get('data')` pointer no longer equal,
// causing unwanted behaviour.
// Instead we're actively setting the dataBlock's data and reloading our `stats.value` to point to the same array in memory.

function removeOption(name: string): void {
    const db = dataBlock.value;
    if (db === null) return;
    db.set(
        "data",
        stats.value.filter((s) => s.name !== name),
        true,
    );
    loadStats();
}
</script>
<template>
    <div id="scc">
        <template v-if="dataBlock === undefined">Loading data...</template>
        <template v-else>
            <template v-for="stat of stats" :key="stat.name">
                <label :for="'#scc-' + stat.name">{{ stat.name }}</label>
                <input
                    v-if="stat.type === 'string'"
                    :id="'#scc-' + stat.name"
                    type="text"
                    :value="stat.value"
                    @change="setStringValue(stat.name, ($event.target as HTMLInputElement).value)"
                />
                <input
                    v-if="stat.type === 'number'"
                    :id="'#scc-' + stat.name"
                    type="number"
                    v-model="stat.value"
                    @change="sync"
                />
                <input
                    v-if="stat.type === 'check'"
                    :id="'#scc-' + stat.name"
                    type="checkbox"
                    v-model="stat.value"
                    @change="sync"
                />
                <font-awesome-icon icon="trash-alt" @click="removeOption(stat.name)" />
            </template>
            <div id="gap"></div>
            <div>Add new stat</div>
            <div>
                <input v-model="selectedName" type="text" style="width: 5rem" placeholder="name" />
                <select v-model="selectedOption">
                    <option v-for="option of options" :key="option">{{ option }}</option>
                </select>
            </div>
            <font-awesome-icon
                icon="plus-square"
                @click="addOption"
                :disabled="selectedName.length === 0 || stats.some((s) => s.name === selectedName)"
            />
        </template>
    </div>
</template>

<style scoped lang="scss">
#scc {
    padding: 1rem;
    background-color: white;
    height: -webkit-fill-available;

    display: grid;
    grid-template-columns: auto 1fr 1rem;
    column-gap: 1rem;
    row-gap: 0.3rem;
    align-items: center;

    #gap {
        min-height: 0.5rem;
        grid-column: 1/-1;
    }
}
</style>
