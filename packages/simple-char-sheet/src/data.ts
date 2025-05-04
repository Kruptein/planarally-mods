// DataBlocks are the way PA offers database side storage for mods

// Datablocks come in 3 different types (see later), have a name and some data
// The name can be any string, as long as there is no other DataBlock of the same type with the same name in your mod.
// Behind the scenes PA will also tag DataBlocks with the mod's id.

// The 3 different types of datablocks are: User, Room, Shape.
// A datablock thus is always related to a specific instance of one of these.
// UserDataBlocks are relevant for storing mod settings for a specific user,
// whereas RoomDataBlocks are useful for storing mod information that is about a Room in general.
// (a "Room" is what PA internally uses to refer to the totality of a campaign, it's the container for all locations etc)
// In this mod we're storing data per character and characters have a 1on1 relationship with shapes,
// so we'll be using ShapeDataBlocks.
// This also means that when the relevant resource (user,room,shape) is removed,
// all related dataBlocks are also immediately cleaned up.

// The DataBlock data is stored as a flat string on the server
// This is the result of calling `JSON.stringify` on your data
// Because this operation is not guaranteed to retain all data (e.g. Set/Map lose their data),
// you can optionally pass a (de)serializer to handle the transformation on a per key basis.
// This means that in the database we store the result of `JSON.stringify(serialize(realData))`
// And when loading a DataBlock we do `deserialize(JSON.parse(stringData))`

// A datablock's data will be accessible simply by accessing the `.data` property of the datablock.
// It should be noted that this is fully mutable, it's up to you to ensure that data changes are tracked properly,
// and persisted to the server when needed. (by an explicit call to `sync()`)

// A DataBlock can be loaded by multiple users at once (e.g. the DM and the player looking at the same character),
// When a sync to the server happens, all other clients that have the dataBlock loaded will be immediately updated.
//
// Additionally, a local client can choose to have the DataBlock's data be tracked reactively.
// This is a Vue concept, and basically allows someone to react to changes in the data without registering callbacks.
// The reactivity of a datablock is entirely opt-in, it's available under the `reactiveData` property,
// which will only start tracking the data reactively once you access it.
// Do note that the `useDataBlock` hook will use this automatically. (this will be used in the `CharTab.vue` component)
// Another warning is that if you do use the reactiveData property,
// you should be aware that mutation of the data should (almost) always happen on the reactiveData property and not on the `data` property.
// This is because reactiveData is a proxy around the actual data, and will not detect the changes made to the data directly.

// All that aside, let's define the data structure we'll be storing in the DataBlock.
// we're not actually loading any datablocks directly ourselves, we could do this if we needed it in multiple locations in our mod,
// but right now we only need it in once place (in the char sheet tab).

interface Stat<T extends string, V> {
    name: string;
    type: T;
    value: V;
}

export type NumberStat = Stat<"number", number>;
export type StringStat = Stat<"string", string>;
export type CheckStat = Stat<"check", boolean>;
export type StatType = NumberStat | StringStat | CheckStat;

export type CharData = StatType[];
