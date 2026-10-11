import type { CompendiumId } from "./compendium.ts";
import type { Grants, Trait } from "./grants.ts";

export type Size = "Tiny" | "Small" | "Medium" | "Large";

interface RaceTraits extends Grants {
    // Walking speed in feet. A subrace value replaces the race value.
    speed?: number;
    size?: Size;
    // Range in feet. A subrace value replaces the race value.
    darkvision?: number;
    traits?: Trait[];
}

export interface Race extends RaceTraits {
    // Default English name
    name: string;
    // Source book
    source: string;
}

// Its grants and traits stack on top of the race
export interface Subrace extends RaceTraits {
    race: CompendiumId<"race">;
    // Default English name
    name: string;
    // Source book
    source: string;
}
