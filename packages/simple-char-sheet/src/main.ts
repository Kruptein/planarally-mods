import type { ApiModMeta, GameApi, LocalId, ModEvents } from "@planarally/mod-api";

import CharTab from "./CharTab.vue";

// We're storing the API object in a global variable so we can access it from other files
// The api is injected with the `initGame` event, you're free to choose how you keep track of it
export let api: GameApi;

// This function is called when a mod is initialized.
//
// The timing of this will depend on the type of mod you're creating.
// This can be the moment a user loads any page on PA, but it can also be specifically when the dashboard is opened
// or when a game is opened. (e.g. a pure in-game mod has no need to load when a user is on the dashboard)
// In practice, currently only in-game mods are supported, so this will be shortly after a game is opened.
// In the future, there might be a specific field in the mod.toml file that can be used to specify the timing of the mod.
//
// It receives the mod metadata as the first argument, allowing the option for possible version specific logic to run (e.g. migrations)
//
// It should be noted that if a user loads a game, goes to the dashboard and then back in a game,
// the init function will not be called again if the mod has been loaded before.
// Use the `initGame` event to do game specific setup.
async function init(meta: ApiModMeta): Promise<void> {
    // We're just verifying if the mod loaded correctly :)
    // This function (like all other functions in this file) is optional
    console.log(`Loading ${meta.name} v${meta.version}`);
}

// This is called when a game session is opened and provides access to most internal PA API's
// This is called very shortly after the initial setup and thus not everything might be fully initialized yet.
// For specific things you need, you might want to wait for a certain event to happen,
// or to wait for the current location to be fully loaded
//
// This is called every time a game session is opened.
// NOT when the location is changed, for that see `loadLocation`.
async function initGame(gameApi: GameApi): Promise<void> {
    // Many parts of our mod will want to interact with the game API
    // How we offer this interface to other parts of the mod is up to you
    // In this simple example we're just globally setting it somewhere
    api = gameApi;

    // We're adding a new tab to the Shape UI, so we have to register this UI component
    // For the purposes of this example,
    // we're limiting this to only shapes that are related to a character (the PA concept).
    // To limit the conditions under which a shape tab appears, a third tab can be provided which is a filter function.
    //
    // This filter can be a pure function or a computed function (this is a Vue concept)
    // If it's a pure function it will be called when the shape UI is opened for a different shape,
    // this can cause some small UI inconsistencies if the tab could appear/disappear depending on shape state.
    // e.g. if you have the shape UI open and make the shape a character, the tab will initially not be visible,
    // until you deselect and reselect the shape.
    // This can be avoided by using a computed function, which can react to state changes.
    // It's however a bit more complicated and given that a shape usually either is or is not a character from its conception,
    // we can go with a regular function here.
    // See the wildsea mod for an example of a computed function.
    //
    // A Shape tab requires a component, this is what will be rendered when the tab is selected.
    // It also requires an id and a label. The ID is a pure technical label that can be used regarldess of user language to activate the tab.
    // The label is what will be displayed in the tab and subject to translations. (It should be noted that translations for mods is not worked out yet)
    api.ui.shape.registerTab(
        { component: CharTab, id: "SCS", label: "Char Sheet" },
        (shape: LocalId) => api.getShape(shape)?.character !== undefined,
    );
}

// This is called when a location is fully loaded.
// Most if not all of the internal data structures should be populated correctly by now.
async function loadLocation(): Promise<void> {
    // If we want to do some location specific setup, we can do that here
    // This example doesn't require anything in particular atm so it's empty,
    // the function can be omitted completely in this case.
}

// PlanaAlly expects an exported 'events' object to find event handlers.
// This allows us to have the actual implementation in separate files and also helps with type safety.
//
// All of these functions as well as the events object itself are optional.
// though without an events object, you're probably not able to do a lot.
export const events: ModEvents = {
    init,
    initGame,
    loadLocation,
};
