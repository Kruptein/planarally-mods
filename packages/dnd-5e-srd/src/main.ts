import type { GameApi, ModEvents } from "@planarally/mod-api";

import conditions from "./data/conditions.json";
import spells from "./data/spells.json";

export let api: GameApi;

async function initGame(gameApi: GameApi): Promise<void> {
    api = gameApi;

    api.compendium.register([...conditions, ...spells], {
        name: "SRD 5.1",
        views: [
            {
                at: ["Spells"],
                name: "Level",
                by: "level",
                order: ["Cantrip", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"],
            },
            { at: ["Spells"], name: "School", by: "school" },
        ],
    });
}

export const events: ModEvents = {
    initGame,
};
