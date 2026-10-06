import type { DataBlock, GlobalId } from "@planarally/mod-api";

import { api } from "../main";

export type RoomData = {
    version: 1;
    ships: GlobalId[]; // UUIDs of the ships in the room
};

const defaultRoomData: RoomData = {
    version: 1,
    ships: [],
};

export let roomData: DataBlock<RoomData>;

export async function loadRoomData(): Promise<DataBlock<RoomData>> {
    // We create a room datablock to track which shapes already have info
    // We just track the ids of these shapes and keep the actual data in shape datablocks.
    // We could skip the entire room datablock in theory, but by doing this we can do the context-menu logic simpler
    // as we just have to check the ID against a reactive array versus having to manage the loading of individual shape datablocks on shape selection.
    const db = await api.getOrLoadDataBlock(
        { category: "room", name: "data" },
        {
            createOnServer: false, // We don't need to create the DB on the server if there was none yet, we can defer this until the first ship is added.
            defaultData: () => defaultRoomData,
        },
    );
    if (!db) throw new Error("Failed to load room data");
    roomData = db;
    return db;
}

export function addShip(shapeId: GlobalId) {
    // We just add the ID to the reactive array and sync
    // this causes the shape tab filter to now show the ship tab for this shape
    // and that will create/load the actual shape datablock
    roomData.reactiveData.value.ships.push(shapeId);
    roomData.sync();
}

export function removeShip(shapeId: GlobalId) {
    // We only remove the ID from the array, so we don't actually end up deleting the shape datablock if it exists.
    // So if at a later point the ship is added again, the original datablock will still be there and will be loaded.
    // This is a design decision, you could also actively delete the shape datablock if it exists.
    roomData.reactiveData.value.ships = roomData.data.ships.filter((id) => id !== shapeId);
    roomData.sync();
}
