import type {
    Attack,
    CharacterDetails,
    Characteristics,
    CharacterState,
    GrantSource,
    Inventory,
    SpellList,
} from "../types/character.ts";
import type { CompendiumId } from "../types/compendium.ts";

// Shape DataBlocks of a character. Only users with edit access to the shape can read or write them.
export const BUILD_BLOCK = "character";
export const STATE_BLOCK = "state";
export const INVENTORY_BLOCK = "inventory";
export const BUILD_VERSION = 1;

export interface ClassBuild {
    id: CompendiumId<"class">;
    level: number;
    // Subclass compendium id, or free text
    subclass: string;
}

// Types rather than interfaces, so they satisfy the DataBlock's record constraint
export type CharacterBuild = {
    version: number;
    // Classes with at least one level, the starting class first
    classes: ClassBuild[];
    // Background, race and subrace compendium ids, or free text for entries outside the compendium
    background: string;
    race: string;
    subrace: string;
    alignment: string;
    // Compendium ids, or free text for languages outside the compendium
    languages: string[];
    characteristics: Characteristics;
    // Kept when the class is removed so adding it back restores them
    spells: Record<CompendiumId<"class">, Record<SpellList, CompendiumId<"spell">[]>>;
    // Picks per source entry (see `choiceKey`) and choice id, kept per entry so switching back restores them
    choices: Record<string, Record<string, string[]>>;
    details: CharacterDetails;
};

export type StateData = {
    version: number;
    state: CharacterState;
};

export type InventoryData = {
    version: number;
    inventory: Inventory;
};

export function emptyDetails(): CharacterDetails {
    return {
        name: "",
        xp: "",
        speedBonus: 0,
        passivePerceptionBonus: 0,
        attacks: [],
        features: [],
        otherProficiencies: "",
        notes: "",
    };
}

export function emptyBuild(): CharacterBuild {
    return {
        version: BUILD_VERSION,
        classes: [],
        background: "",
        race: "",
        subrace: "",
        alignment: "",
        languages: [],
        characteristics: { personalityTraits: "", ideals: "", bonds: "", flaws: "" },
        spells: {},
        choices: {},
        details: emptyDetails(),
    };
}

export function emptyState(): StateData {
    return {
        version: BUILD_VERSION,
        state: {
            hitPoints: { current: 0, temp: 0 },
            spentHitDice: 0,
            deathSaves: { successes: [false, false, false], failures: [false, false, false] },
            inspiration: false,
            spentSlots: Array.from({ length: 9 }, () => 0),
            spentPactSlots: 0,
            spentResources: {},
        },
    };
}

export function emptyInventory(): InventoryData {
    return {
        version: BUILD_VERSION,
        inventory: { items: [], coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }, startingEquipment: [] },
    };
}

function emptyAttack(): Omit<Attack, "id" | "name"> {
    return {
        ability: "",
        proficient: true,
        attackBonus: 0,
        damage: "",
        damageAbility: true,
        damageBonus: 0,
        damageType: "",
        tags: [],
    };
}

// Fills in what older data lacks
export function completeBuild(data: Partial<CharacterBuild>): CharacterBuild {
    const empty = emptyBuild();
    const details = { ...empty.details, ...data.details };
    return {
        ...empty,
        ...data,
        characteristics: { ...empty.characteristics, ...data.characteristics },
        details: { ...details, attacks: details.attacks.map((attack) => ({ ...emptyAttack(), ...attack })) },
    };
}

export function completeState(data: Partial<StateData>): StateData {
    const empty = emptyState();
    return { ...empty, ...data, state: { ...empty.state, ...data.state } };
}

export function completeInventory(data: Partial<InventoryData>): InventoryData {
    const empty = emptyInventory();
    const inventory = { ...empty.inventory, ...data.inventory };
    return { ...empty, ...data, inventory: { ...inventory, coins: { ...empty.inventory.coins, ...inventory.coins } } };
}

export function choiceKey(source: Pick<GrantSource, "kind" | "id">): string {
    return `${source.kind}/${source.id}`;
}

export function emptySpellLists(): Record<SpellList, CompendiumId<"spell">[]> {
    return { cantrips: [], known: [], prepared: [] };
}
