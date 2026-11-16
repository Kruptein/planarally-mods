import type { ChoiceOption } from "../../types/grants.ts";
import { druidicFoci, simpleMeleeWeapons, simpleWeapons } from "../items/index.ts";

import { anyOf, asi, at, characterClass, feature, item, line, SOURCE, steps, subclass } from "./helpers.ts";

export const druid = characterClass(
    "druid",
    "A priest of the Old Faith, wielding the powers of nature and adopting animal forms.",
    {
        name: "Druid",
        source: SOURCE,
        hitDie: 8,
        savingThrows: ["intelligence", "wisdom"],
        armor: ["light-armor", "medium-armor", "shields"],
        weapons: ["club", "dagger", "dart", "javelin", "mace", "quarterstaff", "scimitar", "sickle", "sling", "spear"],
        tools: ["herbalism-kit"],
        skills: [
            {
                id: "skills",
                count: 2,
                from: [
                    "arcana",
                    "animal-handling",
                    "insight",
                    "medicine",
                    "nature",
                    "perception",
                    "religion",
                    "survival",
                ],
            },
        ],
        multiclass: { armor: ["light-armor", "medium-armor", "shields"] },
        subclassLevel: 2,
        subclassTitle: "Druid Circle",
        equipment: [
            line("(a) a wooden shield or (b) any simple weapon", [item("shield")], [anyOf(simpleWeapons)]),
            line("(a) a scimitar or (b) any simple melee weapon", [item("scimitar")], [anyOf(simpleMeleeWeapons)]),
            line("Leather armor, an explorer's pack, and a druidic focus", [
                item("leather"),
                item("explorers-pack"),
                anyOf(druidicFoci),
            ]),
        ],
        spellcasting: {
            ability: "wisdom",
            progression: "full",
            preparation: "prepared",
            cantripsKnown: steps({ 1: 2, 4: 3, 10: 4 }),
            preparedLevelFactor: 1,
        },
        levels: [
            {
                level: 1,
                features: [
                    feature(
                        "Druidic",
                        "You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages. You and others who know this language automatically spot such a message. Others spot the message's presence with a successful DC 15 Wisdom (Perception) check but can't decipher it without magic.",
                    ),
                    feature(
                        "Spellcasting",
                        "Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will. Wisdom is your spellcasting ability for your druid spells, and you can use a druidic focus as a spellcasting focus.",
                    ),
                ],
                grants: { languages: ["Druidic"] },
            },
            at(
                2,
                feature(
                    "Wild Shape",
                    "You can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice, regaining expended uses when you finish a short or long rest. At 2nd level you can transform into a beast with a challenge rating of up to 1/4 and no flying or swimming speed, for up to half your druid level in hours. At 4th level the limit becomes CR 1/2 without a flying speed, and at 8th level CR 1.",
                ),
                feature(
                    "Druid Circle",
                    "You choose to identify with a circle of druids. Your choice grants you features at 2nd level and again at 6th, 10th, and 14th level.",
                ),
            ),
            asi(4),
            asi(8),
            asi(12),
            asi(16),
            at(
                18,
                feature(
                    "Timeless Body",
                    "The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year.",
                ),
                feature(
                    "Beast Spells",
                    "You can cast many of your druid spells in any shape you assume using Wild Shape. You can perform the somatic and verbal components of a druid spell while in a beast shape, but you aren't able to provide material components.",
                ),
            ),
            asi(19),
            at(
                20,
                feature(
                    "Archdruid",
                    "You can use your Wild Shape an unlimited number of times. Additionally, you can ignore the verbal and somatic components of your druid spells, as well as any material components that lack a cost and aren't consumed by a spell.",
                ),
            ),
        ],
    },
);

const landSpells: [id: string, name: string, spells: string][] = [
    [
        "arctic",
        "Arctic",
        "hold person, spike growth; sleet storm, slow; freedom of movement, ice storm; commune with nature, cone of cold",
    ],
    [
        "coast",
        "Coast",
        "mirror image, misty step; water breathing, water walk; control water, freedom of movement; conjure elemental, scrying",
    ],
    [
        "desert",
        "Desert",
        "blur, silence; create food and water, protection from energy; blight, hallucinatory terrain; insect plague, wall of stone",
    ],
    [
        "forest",
        "Forest",
        "barkskin, spider climb; call lightning, plant growth; divination, freedom of movement; commune with nature, tree stride",
    ],
    [
        "grassland",
        "Grassland",
        "invisibility, pass without trace; daylight, haste; divination, freedom of movement; dream, insect plague",
    ],
    [
        "mountain",
        "Mountain",
        "spider climb, spike growth; lightning bolt, meld into stone; stone shape, stoneskin; passwall, wall of stone",
    ],
    [
        "swamp",
        "Swamp",
        "acid arrow, darkness; water walk, stinking cloud; freedom of movement, locate creature; insect plague, scrying",
    ],
    [
        "underdark",
        "Underdark",
        "spider climb, web; gaseous form, stinking cloud; greater invisibility, stone shape; cloudkill, insect plague",
    ],
];

const CIRCLE_LEVELS = [3, 5, 7, 9];

// Spell names map to compendium ids, e.g. "create food and water" to "create-food-and-water"
const lands: ChoiceOption[] = landSpells.map(([id, name, spells]) => ({
    id,
    name,
    description: `Circle spells at 3rd, 5th, 7th, and 9th level: ${spells}.`,
    grants: {
        spells: spells.split(";").flatMap((tier, index) =>
            tier.split(",").map((spell) => ({
                spell: spell.trim().replaceAll(" ", "-"),
                level: CIRCLE_LEVELS[index] ?? 9,
            })),
        ),
    },
}));

export const land = subclass(
    "land",
    "The Circle of the Land is made up of mystics and sages who safeguard ancient knowledge and rites.",
    {
        class: "druid",
        name: "Circle of the Land",
        source: SOURCE,
        levels: [
            {
                level: 2,
                features: [
                    feature("Bonus Cantrip", "You learn one additional druid cantrip of your choice."),
                    feature(
                        "Natural Recovery",
                        "During a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your druid level (rounded up), and none of the slots can be 6th level or higher. You can't use this feature again until you finish a long rest.",
                    ),
                ],
                grants: { spells: [{ id: "bonus-cantrip", count: 1, list: "druid", level: 0 }] },
            },
            {
                level: 3,
                features: [
                    feature(
                        "Circle Spells",
                        "Your mystical connection to the land infuses you with the ability to cast certain spells. At 3rd, 5th, 7th, and 9th level you gain access to circle spells connected to the land where you became a druid. Once you gain access to a circle spell, you always have it prepared, and it doesn't count against the number of spells you can prepare each day.",
                    ),
                ],
                grants: { options: [{ id: "land", name: "Circle Land", options: lands }] },
            },
            at(
                6,
                feature(
                    "Land's Stride",
                    "Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed by them and without taking damage from them if they have thorns, spines, or a similar hazard. In addition, you have advantage on saving throws against plants that are magically created or manipulated to impede movement.",
                ),
            ),
            at(
                10,
                feature(
                    "Nature's Ward",
                    "You can't be charmed or frightened by elementals or fey, and you are immune to poison and disease.",
                ),
            ),
            at(
                14,
                feature(
                    "Nature's Sanctuary",
                    "When a beast or plant creature attacks you, that creature must make a Wisdom saving throw against your druid spell save DC. On a failed save, the creature must choose a different target, or the attack automatically misses. On a successful save, the creature is immune to this effect for 24 hours.",
                ),
            ),
        ],
    },
);
