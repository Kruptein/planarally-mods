import type { CompendiumId } from "./compendium.ts";

export interface Skill {
    // The ability the skill uses, e.g. "dexterity".
    ability: CompendiumId<"ability">;
}
