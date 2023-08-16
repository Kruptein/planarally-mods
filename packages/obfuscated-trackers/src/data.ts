import type { DataBlock, DataBlockSerializer } from "@planarally/mod-api";
import { shallowReactive, type Ref, ref } from "vue";

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
// In this mod we're storing data on trackers, which are a property of shapes, so we'll be using ShapeDataBlocks.
// This also means that when the relevant resource (user,room,shape) is removed,
// all related dataBlocks are also immediately cleaned up.

// First we define some data structures that are used in the DataBlock itself,
// as said we are interested in trackers,
// which makes it slightly more complicated as each shape can have multiple trackers.
// Which is why we're storing the settings we're interested in `TrackerData` in a Map keyed by tracker ID.
//
// In this case we decided to wrap the entire map in a ref, making it reactive.
// Do realise that this is deep reactivity by default!
// Our mod's main use-case will be for HP trackers, so our estimation is that at most 1 tracker per shape will track data,
// so this is not too bad.
// In this case making the DataBlock's internal data non-reactive would probably be interesting,
// as we're not often going to be in the TrackerSettings specifically.
// The extra Map makes this slightly more awkard however to handle without too much extra code,
// so for now we're just taking the small overhead.

export interface TrackerData {
    useObfuscation: boolean;
    realValue: number;
    parts: number;
}

type Data = {
    trackers: Ref<Map<string, TrackerData>>;
};
type SerializedData = {
    trackers: [string, TrackerData][];
};

// As Map<~> is not JSON serializable, we're converting it to/from an array when communicating with the server

export const charSerializer: DataBlockSerializer<Data, SerializedData> = {
    serialize: {
        trackers: (data) => [...data.value.entries()],
    },
    deserialize: {
        trackers: (data) => ref(new Map(data)),
    },
};

// We cache the DataBlocks we've already requested from PA
// Once loaded a DataBlock is always immediately available on the PA side without a server round-trip,
// but by caching it ourselves, we can make some logic tighter and don't require async
// which we would need for the PA calls as they don't make any assumption about availability
//
// We're wrapping it in a shallowReactive as we do want to track new additions to the map reactively in our UI component.
// (shallowReactive is non-deep reactivity, it only checks changes to the Map, but not the inner data)
//
// Important to notice is that we're keying this map by LocalId and not GlobalId.
// Most internal PA APIs use LocalId for performance reasons.
// It's for example the output of the `watch` we're doing in `./main`
// and it's the input for the `api.updateTracker` call in `./TrackerSettings`
// Thus we're also using LocalId for tracking data in our Map.
// The moment we however have to send something to the server we would need to use GlobalIds.
// In the case of mods that can only happen either through internal APIs which take LocalIds as input,
// or by using dataBlocks, which as you can see below also require a GlobalId for their creation.
//
// Potential Pitfalls
//    LocalIds are unknown to the server and are generated on the fly sequentially as requested.
//    This means that you CANNOT rely on a shape having the same LocalId across reloads or location changes
//    It is thus very important to make sure that you clean up data when changing locations.

export const loadedDataBlocks = shallowReactive(new Map<number, DataBlock<Data>>());

export async function loadDataBlock(shapeId: number): Promise<void> {
    if (loadedDataBlocks.has(shapeId)) return;
    const globalId = api.getGlobalId(shapeId);
    if (globalId === undefined) return;
    // Here we're requesting the datablock for this mod from PA
    // This call is a simplification of multiple separate calls/checks,
    // 1. returns the datablock if it exists at the PA side on the client,
    // 2. else: retrieve it from the server if it exists there
    // 3. else: create a new datablock
    // In the latter case, we provide a function to setup the block's initial data
    //
    // By default creation of new dataBlocks is instantly done on the server as well,
    // In our case we actually don't want this as we call this function very often
    // and only actually have data to store if a specific tracker's `use Obfuscation` checkbox is checked
    // Immediate server creation would thus create a whole lot of empty datablocks that just waste space in the database.
    const db = await api.getOrLoadDataBlock<Data, SerializedData>(
        { category: "shape", shape: globalId, name: "tracker-data" },
        charSerializer,
        { createOnServer: false, defaultData: () => ({ trackers: ref(new Map()) }) },
    );
    if (db) loadedDataBlocks.set(shapeId, db);
}
