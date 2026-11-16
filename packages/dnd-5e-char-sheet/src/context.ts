import type { GameApi, LocalId } from "@planarally/mod-api";
import type { CompendiumRef } from "@planarally/system-dnd-5e-srd";
import { ref } from "vue";

export const MOD_SOURCE = "pa/charsheet/5e";

export let api: GameApi;
export const openedCharacterSheet = ref<LocalId | null>(null);

export function bindApi(gameApi: GameApi): void {
    api = gameApi;
}

// DMs always have edit access. Without the access system nobody gets in, rather than everybody.
export function hasEditAccess(shape: LocalId): boolean {
    return api.systems.access.hasAccessTo(shape, "edit") ?? false;
}

export function hasCompendiumEntry(ref: CompendiumRef): boolean {
    return api.compendium.getEntry(ref) !== undefined;
}

export function openCharacterSheet(shape: LocalId): boolean {
    if (!hasEditAccess(shape)) return false;
    openedCharacterSheet.value = shape;
    return true;
}
