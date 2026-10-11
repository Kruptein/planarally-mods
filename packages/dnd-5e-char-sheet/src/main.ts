import type { GameApi, ModEvents } from "@planarally/mod-api";
import { computed } from "vue";

import { bindApi, openedCharacterSheet } from "./context";
import { createShapeContextMenu } from "./menus";
import CharacterSheet from "./ui/CharacterSheet.vue";

async function initGame(gameApi: GameApi): Promise<void> {
    bindApi(gameApi);

    gameApi.ui.shape.registerContextMenuEntry(createShapeContextMenu);

    gameApi.ui.modals.add({
        component: CharacterSheet,
        condition: computed(() => openedCharacterSheet.value !== null),
    });
}

export const events: ModEvents = {
    initGame,
};
