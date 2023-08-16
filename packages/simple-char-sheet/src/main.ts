import type { GameApi } from "@planarally/mod-api";

import { loadDataBlock } from "./data";
import CharTab from "./CharTab.vue";

export let api: GameApi;

// This function is called when mods are enabled.
// This usually happens shortly after opening a PA website on any page (e.g. game, dashboard, ...)
// This allows some initial setup for your mod if it needs it
export async function init(): Promise<void> {
    // We're just verifying if the mod loaded correctly :)
    console.log("Loading SimpleCharSheet");
}

// This is called when a game session is opened and provides access to most internal PA API's
// This is called very shortly after the initial setup and thus not everything might be fully initialized yet.
// For specific things you need, you might want to wait for a certain event to happen,
// or to wait for the current location to be fully loaded
export async function initGame(gameApi: GameApi): Promise<void> {
    // Many parts of our mod will want to interact with the PA API
    // How we offer this interface to other parts of the mod is up to you
    // In this simple example we're just globally setting it somewhere
    api = gameApi;

    // We're adding a new tab to the Shape UI, so we have to register this UI component
    // We only want to show this for shapes that are related to a character,
    // which can be achieved by using the registerTab's third argument which is a filter function
    api.ui.shape.registerTab(
        CharTab,
        "SCS",
        (shape) => api.getShape(shape)?.character !== undefined,
    );
}

// This is called when a location is fully loaded.
// Most if not all of the internal data structures should be populated correctly by now.
export async function loadLocation(): Promise<void> {
    for (const char of api.systems.characters.getAllCharacters()) {
        // We're pre-loading all the server-side stored data for our mod for each character
        // Character sheets are usually something you want to interact with frequently,
        // hence our eager load here.
        // Whether this is a good idea depends heavily upon the frequency with which you need to interact with the data
        await loadDataBlock(char.id);
    }
}
