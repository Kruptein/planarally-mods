import { simpleWeapons } from "../items/index.ts";

import {
    anyOf,
    artisanTools,
    asi,
    at,
    characterClass,
    feature,
    instruments,
    item,
    line,
    SOURCE,
    subclass,
    granting,
} from "./helpers.ts";

export const monk = characterClass(
    "monk",
    "A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.",
    {
        name: "Monk",
        source: SOURCE,
        hitDie: 8,
        savingThrows: ["strength", "dexterity"],
        weapons: ["simple-weapons", "shortsword"],
        tools: [{ id: "tool", count: 1, from: [...artisanTools, ...instruments] }],
        skills: [
            {
                id: "skills",
                count: 2,
                from: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"],
            },
        ],
        multiclass: { weapons: ["simple-weapons", "shortsword"] },
        subclassLevel: 3,
        subclassTitle: "Monastic Tradition",
        equipment: [
            line("(a) a shortsword or (b) any simple weapon", [item("shortsword")], [anyOf(simpleWeapons)]),
            line(
                "(a) a dungeoneer's pack or (b) an explorer's pack",
                [item("dungeoneers-pack")],
                [item("explorers-pack")],
            ),
            line("10 darts", [item("dart", 10)]),
        ],
        levels: [
            granting(
                at(
                    1,
                    feature(
                        "Unarmored Defense",
                        "While you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.",
                    ),
                    feature(
                        "Martial Arts",
                        "While you are unarmed or wielding only monk weapons (shortswords and simple melee weapons without the two-handed or heavy property) and aren't wearing armor or wielding a shield, you can use Dexterity instead of Strength for their attack and damage rolls, you can roll a d4 in place of their normal damage (d6 at 5th level, d8 at 11th, d10 at 17th), and when you take the Attack action you can make one unarmed strike as a bonus action.",
                    ),
                ),
                { unarmoredDefense: { base: 10, abilities: ["wisdom"], shield: false } },
            ),
            at(
                2,
                feature(
                    "Ki",
                    "You have a number of ki points equal to your monk level, regained when you finish a short or long rest. Some ki features require your target to make a saving throw: the DC is 8 + your proficiency bonus + your Wisdom modifier. Flurry of Blows: after the Attack action, spend 1 ki to make two unarmed strikes as a bonus action. Patient Defense: spend 1 ki to take the Dodge action as a bonus action. Step of the Wind: spend 1 ki to take the Disengage or Dash action as a bonus action, and your jump distance is doubled for the turn.",
                ),
                feature(
                    "Unarmored Movement",
                    "Your speed increases by 10 feet while you are not wearing armor or wielding a shield. This bonus increases to 15 feet at 6th level, 20 at 10th, 25 at 14th, and 30 at 18th. At 9th level, you can move along vertical surfaces and across liquids on your turn without falling during the move.",
                ),
            ),
            at(
                3,
                feature(
                    "Monastic Tradition",
                    "You commit yourself to a monastic tradition. Your tradition grants you features at 3rd level and again at 6th, 11th, and 17th level.",
                ),
                feature(
                    "Deflect Missiles",
                    "You can use your reaction to deflect or catch the missile when you are hit by a ranged weapon attack. The damage is reduced by 1d10 + your Dexterity modifier + your monk level. If you reduce it to 0, you can catch the missile and spend 1 ki point to make a ranged attack with it as part of the same reaction.",
                ),
            ),
            asi(4),
            at(
                4,
                feature(
                    "Slow Fall",
                    "You can use your reaction when you fall to reduce any falling damage you take by an amount equal to five times your monk level.",
                ),
            ),
            at(
                5,
                feature(
                    "Extra Attack",
                    "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
                ),
                feature(
                    "Stunning Strike",
                    "When you hit another creature with a melee weapon attack, you can spend 1 ki point to attempt a stunning strike. The target must succeed on a Constitution saving throw or be stunned until the end of your next turn.",
                ),
            ),
            at(
                6,
                feature(
                    "Ki-Empowered Strikes",
                    "Your unarmed strikes count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.",
                ),
            ),
            at(
                7,
                feature(
                    "Evasion",
                    "When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.",
                ),
                feature(
                    "Stillness of Mind",
                    "You can use your action to end one effect on yourself that is causing you to be charmed or frightened.",
                ),
            ),
            asi(8),
            at(
                10,
                feature(
                    "Purity of Body",
                    "Your mastery of the ki flowing through you makes you immune to disease and poison.",
                ),
            ),
            asi(12),
            at(
                13,
                feature(
                    "Tongue of the Sun and Moon",
                    "You learn to touch the ki of other minds so that you understand all spoken languages. Moreover, any creature that can understand a language can understand what you say.",
                ),
            ),
            {
                level: 14,
                features: [
                    feature(
                        "Diamond Soul",
                        "You gain proficiency in all saving throws. Additionally, whenever you make a saving throw and fail, you can spend 1 ki point to reroll it and take the second result.",
                    ),
                ],
                grants: {
                    savingThrows: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
                },
            },
            at(
                15,
                feature(
                    "Timeless Body",
                    "Your ki sustains you so that you suffer none of the frailty of old age, and you can't be aged magically. You can still die of old age, however. In addition, you no longer need food or water.",
                ),
            ),
            asi(16),
            at(
                18,
                feature(
                    "Empty Body",
                    "You can use your action to spend 4 ki points to become invisible for 1 minute. During that time, you also have resistance to all damage but force damage. Additionally, you can spend 8 ki points to cast the astral projection spell, without needing material components.",
                ),
            ),
            asi(19),
            at(
                20,
                feature(
                    "Perfect Self",
                    "When you roll for initiative and have no ki points remaining, you regain 4 ki points.",
                ),
            ),
        ],
    },
);

export const openHand = subclass(
    "open-hand",
    "Monks of the Way of the Open Hand are the ultimate masters of martial arts combat.",
    {
        class: "monk",
        name: "Way of the Open Hand",
        source: SOURCE,
        levels: [
            at(
                3,
                feature(
                    "Open Hand Technique",
                    "Whenever you hit a creature with one of the attacks granted by your Flurry of Blows, you can impose one of the following effects: it must succeed on a Dexterity saving throw or be knocked prone; it must make a Strength saving throw or be pushed up to 15 feet away from you; or it can't take reactions until the end of your next turn.",
                ),
            ),
            at(
                6,
                feature(
                    "Wholeness of Body",
                    "As an action, you can regain hit points equal to three times your monk level. You must finish a long rest before you can use this feature again.",
                ),
            ),
            at(
                11,
                feature(
                    "Tranquility",
                    "At the end of a long rest, you gain the effect of a sanctuary spell that lasts until the start of your next long rest (the spell can end early as normal). The saving throw DC equals 8 + your Wisdom modifier + your proficiency bonus.",
                ),
            ),
            at(
                17,
                feature(
                    "Quivering Palm",
                    "When you hit a creature with an unarmed strike, you can spend 3 ki points to start imperceptible vibrations, which last for a number of days equal to your monk level. You can later use your action to end them; the creature must make a Constitution saving throw. If it fails, it is reduced to 0 hit points. If it succeeds, it takes 10d10 necrotic damage. You can have only one creature under the effect of this feature at a time.",
                ),
            ),
        ],
    },
);
