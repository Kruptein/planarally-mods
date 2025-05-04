import type { GameApi, LocalId, ModEvents } from "@planarally/mod-api";

import ShipSheet from "./ShipSheet.vue";
import { loadRoomData } from "./data/room";
import { createShapeContextMenu } from "./menus";
import { computed } from "vue";

export let api: GameApi;

async function initGame(gameApi: GameApi): Promise<void> {
    api = gameApi;

    const roomData = await loadRoomData();

    api.ui.shape.registerContextMenuEntry(createShapeContextMenu);

    api.ui.shape.registerTab(
        { component: ShipSheet, id: "ship", label: "Ship" },
        computed(() => (shape: LocalId) => {
            const id = api.getGlobalId(shape);
            if (id) return roomData?.reactiveData.value.ships.includes(id) ?? false;
            return false;
        }),
    );
}

export const events: ModEvents = {
    initGame,
};
