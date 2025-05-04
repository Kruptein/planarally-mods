<script setup lang="ts">
import { computed, watch } from "vue";
import { api } from "./main";
import { charSerializer, type Data, type TrackerData } from "./data";
import type { LocalId, TrackerId } from "@planarally/mod-api";

const { data, load } = api.useShapeDataBlock("obfuscated-trackers", {
    defaultData: (): Data => new Map(),
    serializer: charSerializer,
});

let loadedShapeId: LocalId | undefined;

watch(
    () => api.systemsState.selected.reactive.focus,
    async (shapeId) => {
        loadedShapeId = shapeId;
        if (shapeId) {
            load(shapeId);
        }
    },
    { immediate: true },
);

const trackers = computed(() => {
    return api.systems.trackers.state.trackers
        .filter((t) => !t.temporary)
        .map((t) => ({
            uuid: t.uuid,
            name: t.name,
            value: t.value,
            maxValue: t.maxvalue ?? t.value,
            ...data.value.get(t.uuid),
        }));
});

function initCustomData(uuid: TrackerId, realValue: number, realMaxValue: number): TrackerData {
    const newData = {
        useObfuscation: true,
        realValue,
        parts: 4,
        realMaxValue,
    };
    data.value.set(uuid, newData);

    return newData;
}

// The following functions are all related to interacting with the UI itself.
// They all update the internal state of the datablock for the current tracker
// and save the changes to the server.

function setObfuscation(uuid: TrackerId, isChecked: boolean): void {
    const tracker = trackers.value.find((t) => t.uuid === uuid);

    if (tracker === undefined) {
        throw new Error(`Tracker ${uuid} not found during obfuscation.`);
    }

    let trackerData: TrackerData | undefined;
    let delta = { value: tracker.value, maxvalue: tracker.maxValue };

    // If useObfuscation is not set, our mod has not interacted with this tracker yet
    // So we either initialize it when checking it or something very strange happened and we just ignore the event
    if (tracker.useObfuscation === undefined) {
        if (isChecked) {
            trackerData = initCustomData(uuid, tracker.value, tracker.maxValue);
        } else {
            return;
        }
    } else {
        trackerData = data.value.get(uuid);
        if (trackerData === undefined) {
            throw new Error(`Tracker ${uuid} not found during obfuscation.`);
        }
        trackerData.useObfuscation = isChecked;
        // When unchecking the obfuscation state, reset the tracker to the real data,
        // we're not setting the tracker data to the fake values in the other case though,
        // which might seem strange, but we're calling the `updateTracker` function later,
        // which will end up triggering the handler code, which already handles the obfuscation.
        // So this is just to not have to duplicate the logic here.
        if (!isChecked) {
            delta = { value: trackerData.realValue, maxvalue: trackerData.realMaxValue };
        }
    }

    updateTracker(uuid, delta);
}

function updateTracker(uuid: TrackerId, delta: { value?: number; maxvalue?: number }): void {
    if (!loadedShapeId || (delta.value === undefined && delta.maxvalue === undefined)) return;

    api.systems.trackers.update(loadedShapeId, uuid, delta, { server: true, ui: true });
    // Note that we don't need to call save() here, as the tracker update will trigger a db sync in the handler
}

async function setParts(uuid: TrackerId, value: number): Promise<void> {
    // We do an extra check, as there is no point to use obfuscation (or even displaying the tracker) if parts < 2
    if (value < 2) value = 2;
    const trackerData = data.value.get(uuid);
    if (trackerData === undefined) return;
    trackerData.parts = value;
    // We're setting the tracker's value again, to ensure that the handler is re-executed
    // as changing the parts might alter the appearance of the bar
    updateTracker(uuid, { value: trackerData.realValue });
}
</script>
<template>
    <div id="obfuscated-tracker-settings">
        <div>Name</div>
        <div>Obf. enabled</div>
        <div>Real Value</div>
        <div>Real Max Value</div>
        <div># Segments</div>
        <template v-for="tracker in trackers" :key="tracker.uuid">
            <label>{{ tracker.name }}</label>
            <input
                type="checkbox"
                :checked="tracker.useObfuscation"
                @change="setObfuscation(tracker.uuid, ($event.target as HTMLInputElement).checked)"
            />
            <input
                type="number"
                :value="tracker.realValue"
                :disabled="!tracker.useObfuscation"
                @change="
                    updateTracker(tracker.uuid, {
                        value: ($event.target as HTMLInputElement).valueAsNumber,
                    })
                "
            />
            <input
                type="number"
                :value="tracker.realMaxValue"
                :disabled="!tracker.useObfuscation"
                @change="
                    updateTracker(tracker.uuid, {
                        maxvalue: ($event.target as HTMLInputElement).valueAsNumber,
                    })
                "
            />
            <input
                type="number"
                min="2"
                :value="tracker.parts"
                :disabled="!tracker.useObfuscation"
                @change="setParts(tracker.uuid, ($event.target as HTMLInputElement).valueAsNumber)"
            />
        </template>
        <template v-if="trackers.length === 0">
            <p>First make a tracker in the trackers tab!</p>
        </template>
    </div>
</template>

<style scoped lang="scss">
#obfuscated-tracker-settings {
    display: grid;
    grid-template-columns: 1fr repeat(4, auto);
    gap: 10px;

    padding: 1rem;

    background-color: white;

    > div {
        text-decoration: underline;
    }
}

p {
    grid-column: 1 / -1;
}
</style>
