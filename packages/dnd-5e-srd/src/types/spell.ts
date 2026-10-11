import type { CompendiumId } from "./compendium.ts";

export interface SpellComponents {
    verbal: boolean;
    somatic: boolean;
    // The material description, null without a material component
    material: string | null;
}

export interface Spell {
    // 0 for cantrips
    level: number;
    school: string;
    // e.g. "1 action" or "1 reaction"
    castingTime: string;
    // When a reaction is taken, as markdown that can contain compendium links
    trigger?: string;
    range: string;
    components: SpellComponents;
    duration: string;
    concentration: boolean;
    ritual: boolean;
    // Classes whose spell list includes the spell
    classes: CompendiumId<"class">[];
}
