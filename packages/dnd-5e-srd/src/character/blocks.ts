import type { DataBlock, DataBlockData, GameApi, GlobalId, LocalId } from "@planarally/mod-api";
import { shallowReactive } from "vue";

import { SYSTEM } from "./schema.ts";

// One shape DataBlock per character
export interface ShapeBlocks<T> {
    // Starts loading once. A missing block only exists locally until the first change syncs it.
    load(shape: LocalId): void;
    // Reactive, undefined while loading
    get(shape: LocalId): T | undefined;
    // Does nothing while loading, or when the change leaves the data as it is
    update(shape: LocalId, change: (data: T) => void): void;
}

// Also unwraps the reactive proxies of a DataBlock's data
export function cloneJson<T>(data: T): T {
    return JSON.parse(JSON.stringify(data)) as T;
}

export function shapeBlocks<T extends DataBlockData>(
    api: GameApi,
    name: string,
    empty: () => T,
    complete: (data: Partial<T>) => T,
    loaded: (shape: LocalId) => void,
): ShapeBlocks<T> {
    const blocks = shallowReactive(new Map<GlobalId, DataBlock<T>>());
    const loading = new Set<GlobalId>();

    function blockOf(shape: LocalId): DataBlock<T> | undefined {
        const shapeId = api.getGlobalId(shape);
        return shapeId === undefined ? undefined : blocks.get(shapeId);
    }

    function load(shape: LocalId): void {
        const shapeId = api.getGlobalId(shape);
        if (shapeId === undefined || blocks.has(shapeId) || loading.has(shapeId)) return;
        loading.add(shapeId);
        api.getOrLoadDataBlock<T>({ category: "shape", name, shape: shapeId }, { defaultData: empty })
            .then((block) => {
                if (block === undefined) return;
                blocks.set(shapeId, block);
                loaded(shape);
            })
            .catch((error: unknown) => console.error(`[${SYSTEM}] Failed to load the character ${name}`, error))
            .finally(() => loading.delete(shapeId));
    }

    function get(shape: LocalId): T | undefined {
        const block = blockOf(shape);
        return block === undefined ? undefined : complete(block.reactiveData.value);
    }

    function update(shape: LocalId, change: (data: T) => void): void {
        const block = blockOf(shape);
        if (block === undefined) return;
        const data = complete(cloneJson(block.data));
        change(data);
        if (JSON.stringify(data) === JSON.stringify(block.data)) return;
        block.updateData(data);
        block.sync();
    }

    return { load, get, update };
}
