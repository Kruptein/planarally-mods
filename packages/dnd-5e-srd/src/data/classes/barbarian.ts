import { martialMeleeWeapons, simpleWeapons } from "../items/index.ts";

import { anyOf, asi, at, characterClass, feature, item, line, SOURCE, subclass, granting } from "./helpers.ts";

export const barbarian = characterClass(
    "barbarian",
    "A fierce warrior of primitive background who can enter a battle rage.",
    {
        name: "Barbarian",
        source: SOURCE,
        hitDie: 12,
        savingThrows: ["strength", "constitution"],
        armor: ["light-armor", "medium-armor", "shields"],
        weapons: ["simple-weapons", "martial-weapons"],
        skills: [
            {
                id: "skills",
                count: 2,
                from: ["animal-handling", "athletics", "intimidation", "nature", "perception", "survival"],
            },
        ],
        multiclass: { armor: ["shields"], weapons: ["simple-weapons", "martial-weapons"] },
        subclassLevel: 3,
        subclassTitle: "Primal Path",
        equipment: [
            line("(a) a greataxe or (b) any martial melee weapon", [item("greataxe")], [anyOf(martialMeleeWeapons)]),
            line("(a) two handaxes or (b) any simple weapon", [item("handaxe", 2)], [anyOf(simpleWeapons)]),
            line("An explorer's pack and four javelins", [item("explorers-pack"), item("javelin", 4)]),
        ],
        levels: [
            granting(
                at(
                    1,
                    feature(
                        "Rage",
                        "On your turn, you can enter a rage as a bonus action. While raging and not wearing heavy armor, you have advantage on Strength checks and Strength saving throws, gain a bonus to melee weapon damage rolls using Strength (+2, rising to +3 at 9th level and +4 at 16th), and have resistance to bludgeoning, piercing, and slashing damage. You can't cast or concentrate on spells while raging. A rage lasts 1 minute and ends early if you are knocked unconscious or your turn ends without you attacking a hostile creature or taking damage. You can rage twice per long rest, increasing to 3 at 3rd level, 4 at 6th, 5 at 12th, 6 at 17th, and unlimited at 20th.",
                    ),
                    feature(
                        "Unarmored Defense",
                        "While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.",
                    ),
                ),
                { unarmoredDefense: { base: 10, abilities: ["constitution"], shield: true } },
            ),
            at(
                2,
                feature(
                    "Reckless Attack",
                    "When you make your first attack on your turn, you can decide to attack recklessly, giving you advantage on melee weapon attack rolls using Strength during this turn, but attack rolls against you have advantage until your next turn.",
                ),
                feature(
                    "Danger Sense",
                    "You have advantage on Dexterity saving throws against effects that you can see, such as traps and spells. You can't be blinded, deafened, or incapacitated to gain this benefit.",
                ),
            ),
            at(
                3,
                feature(
                    "Primal Path",
                    "You choose a path that shapes the nature of your rage. Your choice grants you features at 3rd level and again at 6th, 10th, and 14th levels.",
                ),
            ),
            asi(4),
            at(
                5,
                feature(
                    "Extra Attack",
                    "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
                ),
                feature("Fast Movement", "Your speed increases by 10 feet while you aren't wearing heavy armor."),
            ),
            at(
                7,
                feature(
                    "Feral Instinct",
                    "You have advantage on initiative rolls. If you are surprised at the beginning of combat and aren't incapacitated, you can act normally on your first turn, but only if you enter your rage before doing anything else on that turn.",
                ),
            ),
            asi(8),
            at(
                9,
                feature(
                    "Brutal Critical",
                    "You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack. This increases to two additional dice at 13th level and three at 17th level.",
                ),
            ),
            at(
                11,
                feature(
                    "Relentless Rage",
                    "If you drop to 0 hit points while raging and don't die outright, you can make a DC 10 Constitution saving throw. If you succeed, you drop to 1 hit point instead. Each time you use this feature after the first, the DC increases by 5. When you finish a short or long rest, the DC resets to 10.",
                ),
            ),
            asi(12),
            at(
                15,
                feature(
                    "Persistent Rage",
                    "Your rage is so fierce that it ends early only if you fall unconscious or if you choose to end it.",
                ),
            ),
            asi(16),
            at(
                18,
                feature(
                    "Indomitable Might",
                    "If your total for a Strength check is less than your Strength score, you can use that score in place of the total.",
                ),
            ),
            asi(19),
            {
                level: 20,
                features: [
                    feature(
                        "Primal Champion",
                        "Your Strength and Constitution scores increase by 4. Your maximum for those scores is now 24.",
                    ),
                ],
                grants: {
                    abilityIncreases: [
                        { ability: "strength", amount: 4 },
                        { ability: "constitution", amount: 4 },
                    ],
                },
            },
        ],
    },
);

export const berserker = subclass(
    "berserker",
    "For some barbarians, rage is a means to an end — that end being violence.",
    {
        class: "barbarian",
        name: "Path of the Berserker",
        source: SOURCE,
        levels: [
            at(
                3,
                feature(
                    "Frenzy",
                    "You can go into a frenzy when you rage. If you do so, for the duration of your rage you can make a single melee weapon attack as a bonus action on each of your turns after this one. When your rage ends, you suffer one level of exhaustion.",
                ),
            ),
            at(
                6,
                feature(
                    "Mindless Rage",
                    "You can't be charmed or frightened while raging. If you are charmed or frightened when you enter your rage, the effect is suspended for the duration of the rage.",
                ),
            ),
            at(
                10,
                feature(
                    "Intimidating Presence",
                    "You can use your action to frighten someone with your menacing presence. Choose one creature that you can see within 30 feet of you. If the creature can see or hear you, it must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + your Charisma modifier) or be frightened of you until the end of your next turn. On subsequent turns, you can use your action to extend the duration.",
                ),
            ),
            at(
                14,
                feature(
                    "Retaliation",
                    "When you take damage from a creature that is within 5 feet of you, you can use your reaction to make a melee weapon attack against that creature.",
                ),
            ),
        ],
    },
);
