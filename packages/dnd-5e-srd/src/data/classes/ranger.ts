import type { ClassLevel } from "../../types/class.ts";
import type { ChoiceOption } from "../../types/grants.ts";
import { simpleMeleeWeapons } from "../items/index.ts";

import {
    anyOf,
    asi,
    at,
    characterClass,
    feature,
    fightingStyle,
    item,
    line,
    SOURCE,
    steps,
    subclass,
} from "./helpers.ts";

const rangerSkills = [
    "animal-handling",
    "athletics",
    "insight",
    "investigation",
    "nature",
    "perception",
    "stealth",
    "survival",
];

const enemyTypes: [id: string, name: string][] = [
    ["aberrations", "Aberrations"],
    ["beasts", "Beasts"],
    ["celestials", "Celestials"],
    ["constructs", "Constructs"],
    ["dragons", "Dragons"],
    ["elementals", "Elementals"],
    ["fey", "Fey"],
    ["fiends", "Fiends"],
    ["giants", "Giants"],
    ["monstrosities", "Monstrosities"],
    ["oozes", "Oozes"],
    ["plants", "Plants"],
    ["undead", "Undead"],
    ["humanoids", "Two races of humanoid"],
];

const enemies: ChoiceOption[] = enemyTypes.map(([id, name]) => ({
    id,
    name,
    description: `Advantage on Wisdom (Survival) checks to track ${name.toLowerCase()} and on Intelligence checks to recall information about them.`,
}));

const terrainTypes: [id: string, name: string][] = [
    ["arctic", "Arctic"],
    ["coast", "Coast"],
    ["desert", "Desert"],
    ["forest", "Forest"],
    ["grassland", "Grassland"],
    ["mountain", "Mountain"],
    ["swamp", "Swamp"],
    ["underdark", "Underdark"],
];

const terrains: ChoiceOption[] = terrainTypes.map(([id, name]) => ({
    id,
    name,
    description: `You are particularly familiar with ${name.toLowerCase()} terrain and adept at traveling and surviving there.`,
}));

const FAVORED_ENEMY =
    "You have significant experience studying, tracking, hunting, and even talking to a certain type of enemy. You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them. You also learn one language of your choice that is spoken by your favored enemies, if they speak one at all. You choose one additional favored enemy, and an associated language, at 6th and 14th level.";

const NATURAL_EXPLORER =
    "When you make an Intelligence or Wisdom check related to your favored terrain, your proficiency bonus is doubled if you are using a skill that you're proficient in. While traveling for an hour or more in your favored terrain, difficult terrain doesn't slow your group's travel, your group can't become lost except by magical means, you remain alert to danger even when engaged in another activity, you can move stealthily at a normal pace when traveling alone, you find twice as much food when foraging, and you learn the exact number, sizes, and how long ago creatures passed through when tracking. You choose additional favored terrain types at 6th and 10th level.";

function favoredEnemy(level: number): ClassLevel {
    return {
        level,
        features: [feature("Favored Enemy", FAVORED_ENEMY)],
        grants: {
            options: [{ id: `favored-enemy-${level}`, name: "Favored Enemy", options: enemies }],
            languages: [{ id: `favored-enemy-language-${level}`, count: 1 }],
        },
    };
}

function naturalExplorer(level: number): ClassLevel {
    return {
        level,
        features: [feature("Natural Explorer", NATURAL_EXPLORER)],
        grants: { options: [{ id: `favored-terrain-${level}`, name: "Favored Terrain", options: terrains }] },
    };
}

export const ranger = characterClass(
    "ranger",
    "A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization.",
    {
        name: "Ranger",
        source: SOURCE,
        hitDie: 10,
        savingThrows: ["strength", "dexterity"],
        armor: ["light-armor", "medium-armor", "shields"],
        weapons: ["simple-weapons", "martial-weapons"],
        skills: [{ id: "skills", count: 3, from: rangerSkills }],
        multiclass: {
            armor: ["light-armor", "medium-armor", "shields"],
            weapons: ["simple-weapons", "martial-weapons"],
            skills: [{ id: "multiclass-skill", count: 1, from: rangerSkills }],
        },
        subclassLevel: 3,
        subclassTitle: "Ranger Archetype",
        equipment: [
            line("(a) scale mail or (b) leather armor", [item("scale-mail")], [item("leather")]),
            line(
                "(a) two shortswords or (b) two simple melee weapons",
                [item("shortsword", 2)],
                [anyOf(simpleMeleeWeapons), anyOf(simpleMeleeWeapons)],
            ),
            line(
                "(a) a dungeoneer's pack or (b) an explorer's pack",
                [item("dungeoneers-pack")],
                [item("explorers-pack")],
            ),
            line("A longbow and a quiver of 20 arrows", [item("longbow"), item("quiver"), item("arrow", 20)]),
        ],
        spellcasting: {
            ability: "wisdom",
            progression: "half",
            preparation: "known",
            spellsKnown: steps({ 2: 2, 3: 3, 5: 4, 7: 5, 9: 6, 11: 7, 13: 8, 15: 9, 17: 10, 19: 11 }),
        },
        levels: [
            favoredEnemy(1),
            naturalExplorer(1),
            fightingStyle(2, "fighting-style", "archery", "defense", "dueling", "two-weapon-fighting"),
            at(
                2,
                feature(
                    "Spellcasting",
                    "You have learned to use the magical essence of nature to cast spells, much as a druid does. Wisdom is your spellcasting ability for your ranger spells.",
                ),
            ),
            at(
                3,
                feature(
                    "Ranger Archetype",
                    "You choose an archetype that you strive to emulate. Your choice grants you features at 3rd level and again at 7th, 11th, and 15th level.",
                ),
                feature(
                    "Primeval Awareness",
                    "You can use your action and expend one ranger spell slot to focus your awareness on the region around you. For 1 minute per level of the spell slot you expend, you can sense whether aberrations, celestials, dragons, elementals, fey, fiends, or undead are present within 1 mile of you (or within up to 6 miles if you are in your favored terrain). This feature doesn't reveal the creatures' location or number.",
                ),
            ),
            asi(4),
            at(
                5,
                feature(
                    "Extra Attack",
                    "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
                ),
            ),
            favoredEnemy(6),
            naturalExplorer(6),
            asi(8),
            at(
                8,
                feature(
                    "Land's Stride",
                    "Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed by them and without taking damage from them if they have thorns, spines, or a similar hazard. In addition, you have advantage on saving throws against plants that are magically created or manipulated to impede movement.",
                ),
            ),
            naturalExplorer(10),
            at(
                10,
                feature(
                    "Hide in Plain Sight",
                    "You can spend 1 minute creating camouflage for yourself. Once you are camouflaged, you can try to hide by pressing yourself up against a solid surface that is at least as tall and wide as you are, gaining a +10 bonus to Dexterity (Stealth) checks as long as you remain there without moving or taking actions.",
                ),
            ),
            asi(12),
            favoredEnemy(14),
            at(
                14,
                feature(
                    "Vanish",
                    "You can use the Hide action as a bonus action on your turn. Also, you can't be tracked by nonmagical means, unless you choose to leave a trail.",
                ),
            ),
            asi(16),
            at(
                18,
                feature(
                    "Feral Senses",
                    "You gain preternatural senses that help you fight creatures you can't see. When you attack a creature you can't see, your inability to see it doesn't impose disadvantage on your attack rolls against it. You are also aware of the location of any invisible creature within 30 feet of you, provided that the creature isn't hidden from you and you aren't blinded or deafened.",
                ),
            ),
            asi(19),
            at(
                20,
                feature(
                    "Foe Slayer",
                    "You become an unparalleled hunter of your enemies. Once on each of your turns, you can add your Wisdom modifier to the attack roll or the damage roll of an attack you make against one of your favored enemies. You can choose to use this feature before or after the roll, but before any effects of the roll are applied.",
                ),
            ),
        ],
    },
);

export const hunter = subclass(
    "hunter",
    "Emulating the Hunter archetype means accepting your place as a bulwark between civilization and the terrors of the wilderness.",
    {
        class: "ranger",
        name: "Hunter",
        source: SOURCE,
        levels: [
            {
                level: 3,
                features: [feature("Hunter's Prey", "You gain one of the following features of your choice.")],
                grants: {
                    options: [
                        {
                            id: "hunters-prey",
                            name: "Hunter's Prey",
                            options: [
                                {
                                    id: "colossus-slayer",
                                    name: "Colossus Slayer",
                                    description:
                                        "When you hit a creature with a weapon attack, the creature takes an extra 1d8 damage if it's below its hit point maximum. You can deal this extra damage only once per turn.",
                                },
                                {
                                    id: "giant-killer",
                                    name: "Giant Killer",
                                    description:
                                        "When a Large or larger creature within 5 feet of you hits or misses you with an attack, you can use your reaction to attack that creature immediately after its attack, provided that you can see the creature.",
                                },
                                {
                                    id: "horde-breaker",
                                    name: "Horde Breaker",
                                    description:
                                        "Once on each of your turns when you make a weapon attack, you can make another attack with the same weapon against a different creature that is within 5 feet of the original target and within range of your weapon.",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                level: 7,
                features: [feature("Defensive Tactics", "You gain one of the following features of your choice.")],
                grants: {
                    options: [
                        {
                            id: "defensive-tactics",
                            name: "Defensive Tactics",
                            options: [
                                {
                                    id: "escape-the-horde",
                                    name: "Escape the Horde",
                                    description: "Opportunity attacks against you are made with disadvantage.",
                                },
                                {
                                    id: "multiattack-defense",
                                    name: "Multiattack Defense",
                                    description:
                                        "When a creature hits you with an attack, you gain a +4 bonus to AC against all subsequent attacks made by that creature for the rest of the turn.",
                                },
                                {
                                    id: "steel-will",
                                    name: "Steel Will",
                                    description: "You have advantage on saving throws against being frightened.",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                level: 11,
                features: [feature("Multiattack", "You gain one of the following features of your choice.")],
                grants: {
                    options: [
                        {
                            id: "multiattack",
                            name: "Multiattack",
                            options: [
                                {
                                    id: "volley",
                                    name: "Volley",
                                    description:
                                        "You can use your action to make a ranged attack against any number of creatures within 10 feet of a point you can see within your weapon's range. You must have ammunition for each target, as normal, and you make a separate attack roll for each target.",
                                },
                                {
                                    id: "whirlwind-attack",
                                    name: "Whirlwind Attack",
                                    description:
                                        "You can use your action to make a melee attack against any number of creatures within 5 feet of you, with a separate attack roll for each target.",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                level: 15,
                features: [
                    feature("Superior Hunter's Defense", "You gain one of the following features of your choice."),
                ],
                grants: {
                    options: [
                        {
                            id: "superior-hunters-defense",
                            name: "Superior Hunter's Defense",
                            options: [
                                {
                                    id: "evasion",
                                    name: "Evasion",
                                    description:
                                        "When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.",
                                },
                                {
                                    id: "stand-against-the-tide",
                                    name: "Stand Against the Tide",
                                    description:
                                        "When a hostile creature misses you with a melee attack, you can use your reaction to force that creature to repeat the same attack against another creature (other than itself) of your choice.",
                                },
                                {
                                    id: "uncanny-dodge",
                                    name: "Uncanny Dodge",
                                    description:
                                        "When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you.",
                                },
                            ],
                        },
                    ],
                },
            },
        ],
    },
);
