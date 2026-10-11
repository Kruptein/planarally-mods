import type { Grants, Trait } from "./grants.ts";
import type { StartingEquipment } from "./item.ts";

export interface Background extends Grants {
    // Default English name
    name: string;
    // Source book
    source: string;

    equipment?: StartingEquipment[];
    feature?: Trait;
    characteristics?: BackgroundCharacteristics;
}

// Suggestion tables, in die order
export interface BackgroundCharacteristics {
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
}
