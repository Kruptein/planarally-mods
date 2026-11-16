import { martialWeapons } from "../items/index.ts";

import { anyOf, asi, characterClass, feature, fightingStyles, item, line, SOURCE, subclass } from "./helpers.ts";

const fighter = characterClass("fighter", "A master of martial combat, skilled with a variety of weapons and armor.", {
    name: "Fighter",
    source: SOURCE,
    hitDie: 10,
    savingThrows: ["strength", "constitution"],
    armor: ["light-armor", "medium-armor", "heavy-armor", "shields"],
    weapons: ["simple-weapons", "martial-weapons"],
    skills: [
        {
            id: "skills",
            count: 2,
            from: [
                "acrobatics",
                "animal-handling",
                "athletics",
                "history",
                "insight",
                "intimidation",
                "perception",
                "survival",
            ],
        },
    ],
    multiclass: {
        armor: ["light-armor", "medium-armor", "shields"],
        weapons: ["simple-weapons", "martial-weapons"],
    },
    subclassLevel: 3,
    subclassTitle: "Martial Archetype",
    equipment: [
        line(
            "(a) chain mail or (b) leather armor, longbow, and 20 arrows",
            [item("chain-mail")],
            [item("leather"), item("longbow"), item("arrow", 20)],
        ),
        line(
            "(a) a martial weapon and a shield or (b) two martial weapons",
            [anyOf(martialWeapons), item("shield")],
            [anyOf(martialWeapons), anyOf(martialWeapons)],
        ),
        line(
            "(a) a light crossbow and 20 bolts or (b) two handaxes",
            [item("light-crossbow"), item("crossbow-bolt", 20)],
            [item("handaxe", 2)],
        ),
        line("(a) a dungeoneer's pack or (b) an explorer's pack", [item("dungeoneers-pack")], [item("explorers-pack")]),
    ],
    levels: [
        {
            level: 1,
            features: [
                feature("Fighting Style", "You adopt a particular style of fighting as your specialty."),
                feature(
                    "Second Wind",
                    "On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.",
                ),
            ],
            grants: { options: [{ id: "fighting-style", name: "Fighting Style", options: fightingStyles }] },
        },
        {
            level: 2,
            features: [
                feature(
                    "Action Surge",
                    "On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn.",
                ),
            ],
        },
        {
            level: 3,
            features: [
                feature(
                    "Martial Archetype",
                    "You choose an archetype that you strive to emulate in your combat styles and techniques. The archetype grants you features at 3rd level and again at 7th, 10th, 15th, and 18th level.",
                ),
            ],
        },
        asi(4),
        {
            level: 5,
            features: [
                feature(
                    "Extra Attack",
                    "You can attack twice, instead of once, whenever you take the Attack action on your turn. The number of attacks increases to three at 11th level and to four at 20th level.",
                ),
            ],
        },
        asi(6),
        asi(8),
        {
            level: 9,
            features: [
                feature(
                    "Indomitable",
                    "You can reroll a saving throw that you fail. If you do so, you must use the new roll, and you can't use this feature again until you finish a long rest. You can use it twice between long rests starting at 13th level and three times starting at 17th level.",
                ),
            ],
        },
        asi(12),
        asi(14),
        asi(16),
        asi(19),
    ],
});

const champion = subclass(
    "champion",
    "The archetypal Champion focuses on raw physical power honed to deadly perfection.",
    {
        class: "fighter",
        name: "Champion",
        source: SOURCE,
        levels: [
            {
                level: 3,
                features: [
                    feature("Improved Critical", "Your weapon attacks score a critical hit on a roll of 19 or 20."),
                ],
            },
            {
                level: 7,
                features: [
                    feature(
                        "Remarkable Athlete",
                        "You can add half your proficiency bonus (round up) to any Strength, Dexterity, or Constitution check you make that doesn't already use your proficiency bonus. In addition, when you make a running long jump, the distance you can cover increases by a number of feet equal to your Strength modifier.",
                    ),
                ],
            },
            {
                level: 10,
                features: [
                    feature(
                        "Additional Fighting Style",
                        "You can choose a second option from the Fighting Style class feature.",
                    ),
                ],
                grants: {
                    options: [{ id: "fighting-style-10", name: "Additional Fighting Style", options: fightingStyles }],
                },
            },
            {
                level: 15,
                features: [
                    feature("Superior Critical", "Your weapon attacks score a critical hit on a roll of 18–20."),
                ],
            },
            {
                level: 18,
                features: [
                    feature(
                        "Survivor",
                        "At the start of each of your turns, you regain hit points equal to 5 + your Constitution modifier if you have no more than half of your hit points left. You don't gain this benefit if you have 0 hit points.",
                    ),
                ],
            },
        ],
    },
);
export { champion, fighter };
