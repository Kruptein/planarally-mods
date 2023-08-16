<script setup lang="ts">
import type { UiTracker } from "@planarally/mod-api";
import { computed } from "vue";

import { loadedDataBlocks } from "./data";
import { api } from "./main";

// This is a Vue component that allows the mod to add extra lines to a Tracker's settings
// Our mod uses this to allow configuring a tracker to be obfuscated
//
// Potential Pitfalls:
// It is important to realise that code in this file is only executed when the Tracker Settings are open.
// If you want certain code paths to be available at all times, you have to declare them somewhere else!

// Vue and reactivity are generally outside the scope of the comments
// PA uses Vue as its main UI/reactivity provider and thus also provides mods with the capability to
// provide UI elements in the form of Vue components.

// The component receives Tracker information as a prop.
const props = defineProps<{ tracker: UiTracker }>();

// When defining UIs, we usually want to use reactivity to automatically update the UI when things happen.
// For mods we usually want to have some reactivity for things in our dataBlock(s).
// Two example ways to do this are
// - already track the reactivity in the dataBlock itself
// - keep the data in the dataBlock non-reactive, but introduce a reactive helper within this component
//
// The former requires you to write (de)serialize code, but can make interacting with the data more organic.
// The latter is more interesting if you want to finetune the performance characteristics of your data access,
// but does require a lot more bookkeeping to ensure things are in sync.

// We're actively monitoring the presence of a dataBlock that is related to the active shape
// This works because we made `loadedDataBlocks` reactive
// This is in principle slightly wasteful as we're actually doing this for each tracker,
// but for this example mod we can turn a blind eye.
const shapeDb = computed(() => loadedDataBlocks.get(props.tracker.shape));

// The data we're actually interested in is the data specific to the current tracker.
const db = computed(() => {
    const trackers = shapeDb.value?.get("trackers").value;
    if (trackers === undefined) return undefined;
    if (!trackers.has(props.tracker.uuid)) {
        // If there is no info on the current tracker, create default info!
        trackers.set(props.tracker.uuid, { useObfuscation: false, realValue: 0, parts: 4 });
    }
    return trackers.get(props.tracker.uuid);
});

// The following functions are all related to interacting with the UI itself.
// They all update the internal state of the datablock for the current tracker
// and save the changes to the server.
//
// You might notice that in all examples we're setting the tracker's new value to
// the real value. This might seem counterintuitive as we set out to obfuscate it.
// Because we want to handle both modifying the real value directly as well as
// interacting with the normal tracker (e.g. through the quick selection info)
// we want to manage the obfuscation logic in only one place,
// to prevent code duplication as well as slight differences in the two approaches.
// When we set the tracker's value, it is sent to PA and in `./handlers.ts` we're
// reacting to every tracker change, be it from a call below or through other UI elements we don't control here.
// The handler there is thus the best place to do our obfuscation.

async function setObfuscation(isChecked: boolean): Promise<void> {
    if (db.value === undefined) return;
    db.value.useObfuscation = isChecked;
    // When toggling the obfuscation we want to make sure
    // that the tracker adapts to the correct value immediately.
    if (isChecked) {
        setValue(props.tracker.value, false);
    } else {
        setValue(db.value.realValue, false);
    }
    // As seen in `./data.ts` we're not creating dataBlocks on the server immediately
    // As such, we need to make sure that we create the db if it does not exist yet
    // at the same time, the db might already exist on the server, so we're using this safe API
    // that handles both cases for us.
    // All the other UI related functions use `.save` directly,
    // as at that point obfuscation must have been enabled already,
    // which means this function was called.
    await shapeDb.value?.saveOrCreate();
}

async function setValue(value: number, sync: boolean): Promise<void> {
    if (db.value === undefined) return;
    db.value.realValue = value;
    api.systems.trackers.update(
        props.tracker.shape,
        props.tracker.uuid,
        { value },
        { server: true, ui: true },
    );
    if (sync) shapeDb.value?.save();
}

async function setParts(value: number): Promise<void> {
    // We do an extra check, as there is no point to use obfuscation (or even displaying the tracker) if parts < 2
    if (value < 2) value = 2;
    if (db.value === undefined) return;
    db.value.parts = value;
    // We're setting the tracker's value again, to ensure that the handler is re-executed
    // as changing the parts might alter the appearance of the bar
    setValue(db.value.realValue, false);
    shapeDb.value?.save();
}
</script>
<template>
    <template v-if="shapeDb === undefined">Loading data...</template>
    <template v-else>
        <label for="useObfuscation">Use obfuscation</label>
        <input
            id="useObfuscation"
            type="checkbox"
            :checked="db?.useObfuscation"
            @change="setObfuscation(($event.target as HTMLInputElement).checked)"
        />
        <template v-if="db?.useObfuscation">
            <label for="realValue">Real value</label>
            <input
                id="realValue"
                type="number"
                :value="db.realValue"
                @change="setValue(($event.target as HTMLInputElement).valueAsNumber, true)"
            />
            <label for="parts"># parts</label>
            <input
                id="parts"
                type="number"
                min="2"
                :value="db.parts"
                @change="setParts(($event.target as HTMLInputElement).valueAsNumber)"
            />
        </template>
    </template>
</template>
