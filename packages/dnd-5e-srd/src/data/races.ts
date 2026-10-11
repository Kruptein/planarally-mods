import type { CompendiumEntry } from "@planarally/mod-api";

// Registered as one collection: a race with subraces gets a folder holding the race and its subraces
export function raceCollection(): CompendiumEntry[] {
    const parents = new Map(races.map((race) => [race.id, race.name]));
    const withSubraces = new Set(subraces.map((subrace) => subrace.schema?.data?.race));
    return [
        ...races.map((race) => (withSubraces.has(race.id) ? { ...race, path: [race.name] } : race)),
        ...subraces.map((subrace) => {
            const parent = parents.get(subrace.schema?.data?.race ?? "");
            return parent === undefined ? subrace : { ...subrace, path: [parent] };
        }),
    ];
}

import type { Trait } from "../types/grants.ts";
import type { Race, Subrace } from "../types/race.ts";

function body(intro: string, traits: readonly Trait[]): string {
    return [intro, ...traits.map((trait) => `**${trait.name}.** ${trait.description}`)].join("\n\n");
}

function race(id: string, intro: string, data: Race): CompendiumEntry<Race> {
    return {
        id,
        name: data.name,
        body: body(intro, data.traits ?? []),
        schema: { system: "dnd-5e", kind: "race", data },
    };
}

function subrace(id: string, intro: string, data: Subrace): CompendiumEntry<Subrace> {
    return {
        id,
        name: data.name,
        body: body(intro, data.traits ?? []),
        schema: { system: "dnd-5e", kind: "subrace", data },
    };
}

const SOURCE = "SRD 5.1";

function darkvisionTrait(intro: string): Trait {
    return {
        name: "Darkvision",
        description: `${intro}, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.`,
    };
}

const ancestries = [
    { id: "black", name: "Black", damage: "Acid", breath: "5 by 30 ft. line (Dex. save)" },
    { id: "blue", name: "Blue", damage: "Lightning", breath: "5 by 30 ft. line (Dex. save)" },
    { id: "brass", name: "Brass", damage: "Fire", breath: "5 by 30 ft. line (Dex. save)" },
    { id: "bronze", name: "Bronze", damage: "Lightning", breath: "5 by 30 ft. line (Dex. save)" },
    { id: "copper", name: "Copper", damage: "Acid", breath: "5 by 30 ft. line (Dex. save)" },
    { id: "gold", name: "Gold", damage: "Fire", breath: "15 ft. cone (Dex. save)" },
    { id: "green", name: "Green", damage: "Poison", breath: "15 ft. cone (Con. save)" },
    { id: "red", name: "Red", damage: "Fire", breath: "15 ft. cone (Dex. save)" },
    { id: "silver", name: "Silver", damage: "Cold", breath: "15 ft. cone (Con. save)" },
    { id: "white", name: "White", damage: "Cold", breath: "15 ft. cone (Con. save)" },
];

export const races = [
    race("dwarf", "Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal.", {
        name: "Dwarf",
        source: SOURCE,
        abilityIncreases: [{ ability: "constitution", amount: 2 }],
        size: "Medium",
        speed: 25,
        darkvision: 60,
        languages: ["common", "dwarvish"],
        weapons: ["battleaxe", "handaxe", "light-hammer", "warhammer"],
        tools: [{ id: "tools", count: 1, from: ["smiths-tools", "brewers-supplies", "masons-tools"] }],
        traits: [
            { name: "Speed", description: "Your speed is not reduced by wearing heavy armor." },
            darkvisionTrait("Accustomed to life underground"),
            {
                name: "Dwarven Resilience",
                description:
                    "You have advantage on saving throws against poison, and you have resistance against poison damage.",
            },
            {
                name: "Dwarven Combat Training",
                description: "You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.",
            },
            {
                name: "Tool Proficiency",
                description:
                    "You gain proficiency with the artisan's tools of your choice: smith's tools, brewer's supplies, or mason's tools.",
            },
            {
                name: "Stonecunning",
                description:
                    "Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check, instead of your normal proficiency bonus.",
            },
        ],
    }),
    race("elf", "Elves are a magical people of otherworldly grace, living in the world but not entirely part of it.", {
        name: "Elf",
        source: SOURCE,
        abilityIncreases: [{ ability: "dexterity", amount: 2 }],
        size: "Medium",
        speed: 30,
        darkvision: 60,
        skills: ["perception"],
        languages: ["common", "elvish"],
        traits: [
            darkvisionTrait("Accustomed to twilit forests and the night sky"),
            { name: "Keen Senses", description: "You have proficiency in the Perception skill." },
            {
                name: "Fey Ancestry",
                description:
                    "You have advantage on saving throws against being charmed, and magic can't put you to sleep.",
            },
            {
                name: "Trance",
                description:
                    "Elves don't need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep.",
            },
        ],
    }),
    race("halfling", "The diminutive halflings survive in a world full of larger creatures by avoiding notice.", {
        name: "Halfling",
        source: SOURCE,
        abilityIncreases: [{ ability: "dexterity", amount: 2 }],
        size: "Small",
        speed: 25,
        languages: ["common", "halfling"],
        traits: [
            {
                name: "Lucky",
                description:
                    "When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.",
            },
            { name: "Brave", description: "You have advantage on saving throws against being frightened." },
            {
                name: "Halfling Nimbleness",
                description: "You can move through the space of any creature that is of a size larger than yours.",
            },
        ],
    }),
    race("human", "Humans are the most adaptable and ambitious people among the common races.", {
        name: "Human",
        source: SOURCE,
        abilityIncreases: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map(
            (ability) => ({ ability, amount: 1 }),
        ),
        size: "Medium",
        speed: 30,
        languages: ["common", { id: "language", count: 1 }],
    }),
    race(
        "dragonborn",
        "Born of dragons, dragonborn walk proudly through a world that greets them with fearful incomprehension.",
        {
            name: "Dragonborn",
            source: SOURCE,
            abilityIncreases: [
                { ability: "strength", amount: 2 },
                { ability: "charisma", amount: 1 },
            ],
            size: "Medium",
            speed: 30,
            languages: ["common", "draconic"],
            options: [
                {
                    id: "ancestry",
                    name: "Draconic Ancestry",
                    options: ancestries.map((ancestry) => ({
                        id: ancestry.id,
                        name: ancestry.name,
                        description: `${ancestry.damage} damage. Breath weapon: ${ancestry.breath}. Resistance to ${ancestry.damage.toLowerCase()} damage.`,
                    })),
                },
            ],
            traits: [
                {
                    name: "Draconic Ancestry",
                    description:
                        "You have draconic ancestry. Choose one type of dragon. Your breath weapon and damage resistance are determined by the dragon type.",
                },
                {
                    name: "Breath Weapon",
                    description:
                        "You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation. When you use your breath weapon, each creature in the area of the exhalation must make a saving throw, the type of which is determined by your draconic ancestry. The DC for this saving throw equals 8 + your Constitution modifier + your proficiency bonus. A creature takes 2d6 damage on a failed save, and half as much damage on a successful one. The damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. After you use your breath weapon, you can't use it again until you complete a short or long rest.",
                },
                {
                    name: "Damage Resistance",
                    description: "You have resistance to the damage type associated with your draconic ancestry.",
                },
            ],
        },
    ),
    race("gnome", "A gnome's energy and enthusiasm for living shines through every inch of his or her tiny body.", {
        name: "Gnome",
        source: SOURCE,
        abilityIncreases: [{ ability: "intelligence", amount: 2 }],
        size: "Small",
        speed: 25,
        darkvision: 60,
        languages: ["common", "gnomish"],
        traits: [
            darkvisionTrait("Accustomed to life underground"),
            {
                name: "Gnome Cunning",
                description:
                    "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.",
            },
        ],
    }),
    race("half-elf", "Half-elves combine what some say are the best qualities of their elf and human parents.", {
        name: "Half-Elf",
        source: SOURCE,
        abilityIncreases: [
            { ability: "charisma", amount: 2 },
            {
                id: "abilities",
                count: 2,
                amount: 1,
                from: ["strength", "dexterity", "constitution", "intelligence", "wisdom"],
            },
        ],
        size: "Medium",
        speed: 30,
        darkvision: 60,
        skills: [{ id: "skills", count: 2 }],
        languages: ["common", "elvish", { id: "language", count: 1 }],
        traits: [
            darkvisionTrait("Thanks to your elf blood"),
            {
                name: "Fey Ancestry",
                description:
                    "You have advantage on saving throws against being charmed, and magic can't put you to sleep.",
            },
            { name: "Skill Versatility", description: "You gain proficiency in two skills of your choice." },
        ],
    }),
    race(
        "half-orc",
        "Half-orcs' grayish pigmentation, sloping foreheads, jutting jaws, and prominent teeth make their orc heritage plain.",
        {
            name: "Half-Orc",
            source: SOURCE,
            abilityIncreases: [
                { ability: "strength", amount: 2 },
                { ability: "constitution", amount: 1 },
            ],
            size: "Medium",
            speed: 30,
            darkvision: 60,
            skills: ["intimidation"],
            languages: ["common", "orc"],
            traits: [
                darkvisionTrait("Thanks to your orc blood"),
                { name: "Menacing", description: "You gain proficiency in the Intimidation skill." },
                {
                    name: "Relentless Endurance",
                    description:
                        "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can't use this feature again until you finish a long rest.",
                },
                {
                    name: "Savage Attacks",
                    description:
                        "When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time and add it to the extra damage of the critical hit.",
                },
            ],
        },
    ),
    race(
        "tiefling",
        "To be greeted with stares and whispers, to suffer violence and insult on the street: this is the lot of the tiefling.",
        {
            name: "Tiefling",
            source: SOURCE,
            abilityIncreases: [
                { ability: "intelligence", amount: 1 },
                { ability: "charisma", amount: 2 },
            ],
            size: "Medium",
            speed: 30,
            darkvision: 60,
            languages: ["common", "infernal"],
            spells: ["thaumaturgy", { spell: "hellish-rebuke", level: 3 }, { spell: "darkness", level: 5 }],
            spellcastingAbility: "charisma",
            traits: [
                darkvisionTrait("Thanks to your infernal heritage"),
                { name: "Hellish Resistance", description: "You have resistance to fire damage." },
                {
                    name: "Infernal Legacy",
                    description:
                        "You know the thaumaturgy cantrip. When you reach 3rd level, you can cast the hellish rebuke spell as a 2nd-level spell once with this trait and regain the ability to do so when you finish a long rest. When you reach 5th level, you can cast the darkness spell once with this trait and regain the ability to do so when you finish a long rest. Charisma is your spellcasting ability for these spells.",
                },
            ],
        },
    ),
];

export const subraces = [
    subrace("hill-dwarf", "As a hill dwarf, you have keen senses, deep intuition, and remarkable resilience.", {
        race: "dwarf",
        name: "Hill Dwarf",
        source: SOURCE,
        abilityIncreases: [{ ability: "wisdom", amount: 1 }],
        traits: [
            {
                name: "Dwarven Toughness",
                description:
                    "Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.",
            },
        ],
    }),
    subrace("high-elf", "As a high elf, you have a keen mind and a mastery of at least the basics of magic.", {
        race: "elf",
        name: "High Elf",
        source: SOURCE,
        abilityIncreases: [{ ability: "intelligence", amount: 1 }],
        weapons: ["longsword", "shortsword", "shortbow", "longbow"],
        languages: [{ id: "language", count: 1 }],
        spells: [{ id: "cantrip", count: 1, list: "wizard", level: 0 }],
        spellcastingAbility: "intelligence",
        traits: [
            {
                name: "Elf Weapon Training",
                description: "You have proficiency with the longsword, shortsword, shortbow, and longbow.",
            },
            {
                name: "Cantrip",
                description:
                    "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.",
            },
            {
                name: "Extra Language",
                description: "You can speak, read, and write one extra language of your choice.",
            },
        ],
    }),
    subrace(
        "lightfoot",
        "As a lightfoot halfling, you can easily hide from notice, even using other people as cover.",
        {
            race: "halfling",
            name: "Lightfoot",
            source: SOURCE,
            abilityIncreases: [{ ability: "charisma", amount: 1 }],
            traits: [
                {
                    name: "Naturally Stealthy",
                    description:
                        "You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.",
                },
            ],
        },
    ),
    subrace(
        "rock-gnome",
        "As a rock gnome, you have a natural inventiveness and hardiness beyond that of other gnomes.",
        {
            race: "gnome",
            name: "Rock Gnome",
            source: SOURCE,
            abilityIncreases: [{ ability: "constitution", amount: 1 }],
            tools: ["tinkers-tools"],
            traits: [
                {
                    name: "Artificer's Lore",
                    description:
                        "Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus, instead of any proficiency bonus you normally apply.",
                },
                {
                    name: "Tinker",
                    description:
                        "You have proficiency with artisan's tools (tinker's tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device (AC 5, 1 hp): a clockwork toy, a fire starter, or a music box. It ceases to function after 24 hours unless you spend 1 hour repairing it.",
                },
            ],
        },
    ),
];
