import { shallowReactive } from "vue";

import type { DataBlock } from "@planarally/mod-api";
import { api } from "./main";

// DataBlocks are the way PA offers database side storage for mods
// A DataBlock consists of a modId, a name unique to the mod and some data
// The DataBlock data is stored as a flat string on the server
// This is the result of calling `JSON.stringify` on your data
// Because this operation is not guaranteed to retain all data (e.g. Set/Map lose their data),
// you can optionally pass a (de)serializer to handle the transformation on a per key basis.
// This means that in the database we store the result of `JSON.stringify(serialize(realData))`
// And when loading a DataBlock we do `deserialize(JSON.parse(stringData))`

// There are 3 different types of datablocks: User, Room, Shape.
// A datablock thus is always related to a specific instance of one of these.
// UserDataBlocks are relevant for storing mod settings for a specific user,
// whereas RoomDataBlocks are useful for storing mod information that is about a Room in general.
// In this mod we're storing data per character and characters have a 1on1 relationship with shapes,
// so we'll be using ShapeDataBlocks.
// This also means that when the relevant resource (user,room,shape) is removed,
// all related dataBlocks are also immediately cleaned up.

// First we define some data structures that are used in the DataBlock itself,
// We choose to not make the dataBlock's content itself reactive here.
// In our current version of this character sheet, there is no interaction with other PA elements,
// this means that the only moment our data is visible is when we open the new tab we made.
// So keeping track of things reactively in advance is pretty wasteful.
// Instead we wrap the relevant data in reactivity when we open the character sheet.

interface Stat<T extends string, V> {
    name: string;
    type: T;
    value: V;
}

export type NumberStat = Stat<"number", number>;
export type StringStat = Stat<"string", string>;
export type CheckStat = Stat<"check", boolean>;
export type StatType = NumberStat | StringStat | CheckStat;

export type CharData = {
    data: StatType[];
};

// We cache the DataBlocks we've already requested from PA.
// Once loaded a DataBlock is always immediately available on the PA side without a server round-trip,
// but by caching it ourselves, we can make some logic tighter and don't require async
// which we would need for the PA calls as they don't make any assumption about availability
//
// Because our CharTab.vue is interested in which characters have been loaded so far
// we're making this Map reactive. We however don't want all the DataBlocks to also become reactive
// which is why we're wrapping the map in a `shallowReactive` to only track map changes reactively but nothing deeper

export const loadedDataBlocks = shallowReactive(new Map<number, DataBlock<CharData>>());

export async function loadDataBlock(char: number): Promise<void> {
    if (loadedDataBlocks.has(char)) return;
    const shape = api.systems.characters.getShape(char);
    if (shape === undefined) return;
    const shapeId = api.getGlobalId(shape.id);
    if (shapeId === undefined) return;
    // Here we're requesting the datablock for this mod and the active character from PA
    // This call is a simplification of multiple separate calls,
    // It will get the datablock if it already exists at the PA side on the client,
    // It will load the datablock from the server if it exists on the server
    // It will create a new datablock if the particular datablock does not yet exist on the server
    // In the latter case, we provide a function to setup the block's initial data
    const db = await api.getOrLoadDataBlock(
        { category: "shape", name: "data", shape: shapeId },
        {}, // We don't need a (de)serializer for this mod, as we're only dealing with JSON safe types
        {
            defaultData: () => ({
                data: [],
            }),
        },
    );
    if (db) loadedDataBlocks.set(char, db);
}
