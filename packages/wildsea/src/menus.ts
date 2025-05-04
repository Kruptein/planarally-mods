import { addShip, removeShip } from "./data/room";

import type { Section } from "@planarally/mod-api";

import type { LocalId } from "@planarally/mod-api";
import { api } from "./main";
import { roomData } from "./data/room";
import { computed } from "vue";

export const createShapeContextMenu = computed(() => (shape: LocalId): Section[] => {
    const id = api.getGlobalId(shape);
    if (!id || !roomData) return [];

    const subitems: Section[] = [];

    const hasShip = roomData.reactiveData.value.ships.includes(id);
    if (hasShip) {
        subitems.push({
            title: "Remove Ship",
            action: () => {
                removeShip(id);
                return true;
            },
        });
    } else {
        subitems.push({
            title: "Add Ship",
            action: () => {
                addShip(id);
                return true;
            },
        });
    }

    return [
        {
            title: "Wildsea",
            subitems,
        },
    ];
});
