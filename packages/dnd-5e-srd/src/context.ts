import type { GameApi } from "@planarally/mod-api";

// Kept out of main.ts, so components can use it without importing the entry module back
export let api: GameApi;

export function bindApi(gameApi: GameApi): void {
    api = gameApi;
}
