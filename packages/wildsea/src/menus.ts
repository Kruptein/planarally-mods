import type { LocalId, Section } from "@planarally/mod-api";
import { computed } from "vue";

import { addShip, removeShip } from "./data/room";
import { roomData } from "./data/room";
import { api } from "./main";

// This builds a menu for the shape context menu
// This is reactive and thus changes based on the shape selection and the room data
export const createShapeContextMenu = computed(() => (shape: LocalId): Section[] => {
    const id = api.getGlobalId(shape);
    if (!id) return [];

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
