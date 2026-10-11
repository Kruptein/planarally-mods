import { api, openedCharacterSheet } from "../context";

export const ROLL_HINT = "Click to roll · Alt advantage · Ctrl disadvantage";

function isRollError(error: unknown): boolean {
    return error instanceof Error && error.name === "DiceRollError";
}

// The host shows a toast for problems with the expression, anything else is unexpected
export function roll(expression: string, label: string): void {
    const shape = openedCharacterSheet.value;
    if (shape === null) return;
    api.dice.roll(expression, { shape, label }).catch((error: unknown) => {
        if (!isRollError(error)) console.error(error);
    });
}

// A d20 roll plus `bonus`, a dice expression such as a custom data reference, or nothing when empty.
// Alt rolls with advantage, Ctrl or Cmd with disadvantage.
export function rollD20(bonus: string, label: string, event: MouseEvent | KeyboardEvent): void {
    const tail = bonus === "" ? "" : ` + ${bonus}`;
    if (event.altKey) roll(`2d20kh1${tail}`, `${label} (advantage)`);
    else if (event.ctrlKey || event.metaKey) roll(`2d20kl1${tail}`, `${label} (disadvantage)`);
    else roll(`1d20${tail}`, label);
}
