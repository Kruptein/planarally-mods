import type { GameApi, ModEvents } from "@planarally/mod-api";

import { createCharacterService } from "./character/service.ts";
import { addCompendiumEntries } from "./compendium.ts";
import { bindApi } from "./context.ts";
import type { SrdModApi } from "./types/character.ts";

async function initGame(api: GameApi): Promise<void> {
    bindApi(api);

    addCompendiumEntries(api);

    api.provideApi({ character: createCharacterService(api) } satisfies SrdModApi);
}

export const events: ModEvents = {
    initGame,
};
