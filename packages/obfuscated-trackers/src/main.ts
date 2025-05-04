import type { GameApi, ModEvents } from "@planarally/mod-api";

import TrackerSettings from "./TrackerSettings.vue";
import { preTrackerUpdate } from "./handlers";
import { watch } from "vue";
import { charSerializer, getRepr } from "./data";

// The simple-character-sheet mod has extensive comments for most functions,
// those won't be repeated here, only things that are new or different will be explained.

export let api: GameApi;

async function initGame(gameApi: GameApi): Promise<void> {
    api = gameApi;

    api.ui.shape.registerTab(
        {
            id: "obfuscated-trackers",
            label: "Obfuscated",
            component: TrackerSettings,
        },
        // We only want to show the tab if the user has edit access to the shape
        (shapeId, hasEditAccess) => {
            return hasEditAccess;
        },
    );

    // We need to ensure that the data block is loaded when the shape is selected regardless of whether our custom mod tab is open
    // This is to ensure that modifications to the tracker actually are handled by the time our tracker handler is called
    watch(
        () => api.systemsState.selected.reactive.focus,
        async (shapeId) => {
            if (shapeId) {
                const globalId = api.getGlobalId(shapeId);
                if (globalId === undefined) return;

                await api.getOrLoadDataBlock(getRepr(globalId), {
                    defaultData: () => new Map(),
                    serializer: charSerializer,
                });
            }
        },
    );
}

export const events: ModEvents = {
    initGame,
    preTrackerUpdate,
};
