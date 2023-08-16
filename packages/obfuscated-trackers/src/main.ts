import type { GameApi } from "@planarally/mod-api";

import TrackerSettings from "./TrackerSettings.vue";
import { watch } from "vue";
import { loadDataBlock } from "./data";
import { preTrackerUpdate } from "./handlers";
export { preTrackerUpdate };

export let api: GameApi;

// This function is called when mods are enabled.
// This usually happens shortly after opening a PA website on any page (e.g. game, dashboard, ...)
// This allows some initial setup for your mod if it needs it
export async function init(): Promise<void> {
    // We're just verifying if the mod loaded correctly :)
    console.log("Loading Obfuscated Trackers");
}

// This is called when a game session is opened and provides access to most internal PA API's
// This is called very shortly after the initial setup and thus not everything might be fully initialized yet.
// For specific things you need, you might want to wait for a certain event to happen, or the more likely approach
// to wait for the current location to be loaded
export async function initGame(gameApi: GameApi): Promise<void> {
    // Many parts of our mod will want to interact with the PA API
    // How we offer this interface to other parts of the mod is up to you
    // In this simple example we're just globally setting it somewhere
    api = gameApi;

    // Our mod needs some configuration per tracker, so we register the relevant UI component.
    api.ui.shape.registerTrackerSettings(TrackerSettings, "Obfuscated Trackers");

    // Lastly, we actively monitor the currently selected shape
    // When a shape is selected, we already fetch potential datablocks associated with that shape and our mod
    // so that they're ready when we open the tracker settings
    watch(
        () => api.systemsState.selected.reactive.focus,
        async (focus) => {
            if (focus !== undefined) {
                await loadDataBlock(focus);
            }
        },
    );
}
