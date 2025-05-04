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

export let roomData: DataBlock<RoomData> | undefined;

export async function loadRoomData(): Promise<DataBlock<RoomData> | undefined> {
    const db = await api.getOrLoadDataBlock(
        { category: "room", name: "data" },
        {
            createOnServer: false,
            defaultData: () => defaultRoomData,
        },
    );
    if (db) roomData = db;
    return db;
}

export function addShip(shapeId: GlobalId) {
    if (roomData) {
        roomData.reactiveData.value.ships.push(shapeId);
        roomData.sync();
    }
}

export function removeShip(shapeId: GlobalId) {
    if (roomData) {
        roomData.reactiveData.value.ships = roomData.data.ships.filter((id) => id !== shapeId);
        // roomData. data.ships = ships.filter((id) => id !== shapeId);
        roomData.sync();
    }
}
