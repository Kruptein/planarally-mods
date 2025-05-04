// import type { DataBlock, LocalId } from "@planarally/mod-api";
// import { shallowReactive } from "vue";
// import { api } from "../main";

export type ShipData = {
    version: 1;
    cargo: string;
    conditions: string;
    design: {
        bite: string;
        engine: string;
        frame: string;
        hull: string;
        size: string;
    };
    fittings: {
        armaments: string;
        motifs: string;
        outriders: string;
    };
    name: string;
    notes: string;
    ratings: {
        armour: number;
        seals: number;
        speed: number;
        saws: number;
        stealth: number;
        tilt: number;
    };
    reputation: string[];
    stakesTotal: number;
    stakesUsed: number;
    undercrew: string[];
};

export const defaultShipData: ShipData = {
    version: 1,
    cargo: "",
    conditions: "",
    design: {
        bite: "",
        engine: "",
        frame: "",
        hull: "",
        size: "",
    },
    fittings: {
        armaments: "",
        motifs: "",
        outriders: "",
    },
    name: "",
    notes: "",
    ratings: {
        armour: 1,
        seals: 1,
        speed: 1,
        saws: 1,
        stealth: 1,
        tilt: 1,
    },
    reputation: [],
    stakesTotal: 0,
    stakesUsed: 0,
    undercrew: [],
};

// export const shipDataBlocks = shallowReactive(new WeakMap<LocalId, DataBlock<ShipData>>());

// export async function loadShipData(shapeId: LocalId): Promise<DataBlock<ShipData> | undefined> {
//     if (shipDataBlocks.has(shapeId)) return shipDataBlocks.get(shapeId);
//     const globalId = api.getGlobalId(shapeId);
//     if (globalId === undefined) return;
//     const db = await api.getOrLoadDataBlock(
//         { category: "shape", name: "data", shape: globalId },
//         {
//             createOnServer: false,
//             defaultData: () => defaultShipData,
//         },
//     );
//     if (db) shipDataBlocks.set(shapeId, db);
//     return db;
// }
