import type { GameApi, LocalId, ModEvents } from "@planarally/mod-api";
import { computed } from "vue";

import { loadRoomData } from "./data/room";
import { createShapeContextMenu } from "./menus";
import ShipSheet from "./ShipSheet.vue";

export let api: GameApi;

async function initGame(gameApi: GameApi): Promise<void> {
    api = gameApi;

    // At startup, load (or create) a datablock for the current room
    const roomData = await loadRoomData();

    // Ensure that each shape has a context-menu entry for our mod
    api.ui.shape.registerContextMenuEntry(createShapeContextMenu);

    // Ensure that each shape that has a ship shows the ship tab
    // this runs entirely dynamically based on the room data and the shape selection
    api.ui.shape.registerTab(
        { component: ShipSheet, id: "ship", label: "Ship" },
        computed(() => (shape: LocalId) => {
            const id = api.getGlobalId(shape);
            if (id) return roomData.reactiveData.value.ships.includes(id);
            return false;
        }),
    );
}

export const events: ModEvents = {
    initGame,
};
