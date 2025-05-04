<script setup lang="ts">
import { ref, watch } from "vue";

import { api } from "./main";
import { type CharData, type StatType } from "./data";

// This is a Vue component that is rendered as a tab in the Shape Edit dialog.
// Our mod uses this to configure a mini character sheet for characters

// PA uses Vue as its main UI/reactivity provider and thus also provides mods with the capability to
// provide UI elements in the form of Vue components.
// Vue and reactivity are generally outside the scope of the annotated comments

// PA offers a hook that handles a lot of the boilerplate for interacting with data blocks in a reactive context.
// (It's strongly recommended to first read the `data.ts` file to understand how datablocks work)
// It outputs:
// - `data`: A vue ref containing the data of the block, it's kept up to date when other clients update the data block.
//           You can mutate the inner data of the ref freely, and it will update the data block automatically.
//           You can however NOT directly mutate the root ref itself, this causes desyncs between internal state and should instead be handled by the `write` function.
// - `load`: A function that expects a shape ID and will load the data block for that shape in the `data` ref.
// - `save`: Save the current datablock to the server. If you mutate the data, but never save it, changes will be lost on reload or external changes!
// - `write`: Modify the root ref. This is a utility function that should be used if you want to completely overwrite the data instead of mutating a specific sub element.
//            This is usually not necessary, but we show an example use in the `removeOption` function.
//
// You can also choose to use the dataBlock APIs directly instead of using this hook,
// but you'll have to handle the synchronization logic of remote updates and UI modifications yourself.
const { data, load, save, write } = api.useShapeDataBlock(
    // The first argument is the name of the data block
    // data is a super generic name, but you can choose anything here
    "data",
    // The second argument contains the regular data block options, but defaultData is mandatory as we need it to init the data to something sensible.
    { defaultData: () => [] as CharData },
);

// Next up, we need to populate the ref with the data of the current character
watch(
    () => api.systemsState.characters.reactive.activeCharacterId,
    async (charId) => {
        if (charId !== undefined) {
            const shapeId = api.systems.characters.getShapeId(charId);
            if (shapeId) load(shapeId);
        }
        // If the characterId is undefined, we in theory want to clear data,
        // but given that this tab is only rendered when a character is selected,
        // we can skip this step.
    },
    // We need to set the `immediate` flag, as the code in this component is only executed once the component is loaded.
    // A watcher is lazy by default, which means that the above code will only execute once the watch condition changes
    // In which case we would miss the case where we just mounted the component with a character already selected.
    // We could handle this with a separate `onMounted`, but we're just duplicating code at that point, so `immediate` it is!
    { immediate: true },
);

// Handling of adding & removing a stat

const options = ["Text", "Number", "Checkbox"] as const;
const selectedOption = ref<(typeof options)[number]>(options[0]);
const selectedName = ref("");

function addOption(): void {
    const name = selectedName.value;
    if (name.length === 0 || data.value.some((s) => s.name === name)) return;

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
    data.value.push(stat);
    save();
}

function removeOption(name: string): void {
    // Here we need to use the write function, as we're effectively overwriting the data array with another one.
    // If we instead spliced the data from the array, we'd be able to do this without needing the `write` helper.
    write(data.value.filter((s) => s.name !== name));
    save();
}
</script>

<template>
    <!-- This is a super simple & dry character sheet template, but it's a good starting point to just show something off -->
    <div id="scc">
        <template v-for="stat of data" :key="stat.name">
            <label :for="'#scc-' + stat.name">{{ stat.name }}</label>
            <input
                v-if="stat.type === 'string'"
                :id="'#scc-' + stat.name"
                type="text"
                v-model="stat.value"
                @change="save"
            />
            <input
                v-if="stat.type === 'number'"
                :id="'#scc-' + stat.name"
                type="number"
                v-model="stat.value"
                @change="save"
            />
            <input
                v-if="stat.type === 'check'"
                :id="'#scc-' + stat.name"
                type="checkbox"
                v-model="stat.value"
                @change="save"
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
            :disabled="selectedName.length === 0 || data.some((s) => s.name === selectedName)"
        />
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
