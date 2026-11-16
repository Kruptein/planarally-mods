import type { LocalId, Section } from "@planarally/mod-api";
import { computed } from "vue";

import { hasEditAccess, openCharacterSheet } from "./context";

export const createShapeContextMenu = computed(() => (shape: LocalId): Section[] => {
    if (!hasEditAccess(shape)) return [];
    return [
        {
            title: "Open Character Sheet",
            action: () => {
                openCharacterSheet(shape);
                return true;
            },
        },
    ];
});
