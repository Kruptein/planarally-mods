import type {
    DataBlock,
    DataBlockSerializer,
    GlobalId,
    LocalId,
    ModRepr,
    TrackerId,
} from "@planarally/mod-api";
import { api } from "./main";

export interface TrackerData {
    useObfuscation: boolean;
    parts: number;
    realValue: number;
    realMaxValue: number;
}

export type Data = Map<TrackerId, TrackerData>;
type SerializedData = [TrackerId, TrackerData][];

// As Map<~> is not JSON serializable, we're converting it to/from an array when communicating with the server

export const charSerializer: DataBlockSerializer<SerializedData, Data> = {
    serialize: (data) => [...data.entries()],
    deserialize: (data) => new Map(data),
};

export function getRepr(shapeId: GlobalId): ModRepr {
    return { category: "shape", shape: shapeId, name: "obfuscated-trackers" };
}

export function getDataBlock(shapeId: LocalId): DataBlock<SerializedData, Data> | undefined {
    const globalId = api.getGlobalId(shapeId);
    if (globalId === undefined) return undefined;
    return api.getDataBlock<SerializedData, Data>(getRepr(globalId));
}
