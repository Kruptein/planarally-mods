import { arcaneFoci, simpleWeapons } from "../items/index.ts";

import { anyOf, asi, at, characterClass, feature, item, line, SOURCE, steps, subclass } from "./helpers.ts";

export const warlock = characterClass(
    "warlock",
    "A wielder of magic that is derived from a bargain with an extraplanar entity.",
    {
        name: "Warlock",
        source: SOURCE,
        hitDie: 8,
        savingThrows: ["wisdom", "charisma"],
        armor: ["light-armor"],
        weapons: ["simple-weapons"],
        skills: [
            {
                id: "skills",
                count: 2,
                from: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"],
            },
        ],
        multiclass: { armor: ["light-armor"], weapons: ["simple-weapons"] },
        subclassLevel: 1,
        subclassTitle: "Otherworldly Patron",
        equipment: [
            line(
                "(a) a light crossbow and 20 bolts or (b) any simple weapon",
                [item("light-crossbow"), item("crossbow-bolt", 20)],
                [anyOf(simpleWeapons)],
            ),
            line("(a) a component pouch or (b) an arcane focus", [item("component-pouch")], [anyOf(arcaneFoci)]),
            line(
                "(a) a scholar's pack or (b) a dungeoneer's pack",
                [item("scholars-pack")],
                [item("dungeoneers-pack")],
            ),
            line("Leather armor, any simple weapon, and two daggers", [
                item("leather"),
                anyOf(simpleWeapons),
                item("dagger", 2),
            ]),
        ],
        spellcasting: {
            ability: "charisma",
            progression: "pact",
            preparation: "known",
            cantripsKnown: steps({ 1: 2, 4: 3, 10: 4 }),
            spellsKnown: steps({
                1: 2,
                2: 3,
                3: 4,
                4: 5,
                5: 6,
                6: 7,
                7: 8,
                8: 9,
                9: 10,
                11: 11,
                13: 12,
                15: 13,
                17: 14,
                19: 15,
            }),
        },
        levels: [
            at(
                1,
                feature(
                    "Otherworldly Patron",
                    "You have struck a bargain with an otherworldly being of your choice. Your choice grants you features at 1st level and again at 6th, 10th, and 14th level.",
                ),
                feature(
                    "Pact Magic",
                    "Your arcane research and the magic bestowed on you by your patron have given you facility with spells. Charisma is your spellcasting ability for your warlock spells, and you can use an arcane focus as a spellcasting focus. All of your spell slots are the same level, and you regain them when you finish a short or long rest.",
                ),
            ),
            at(
                2,
                feature(
                    "Eldritch Invocations",
                    "In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability. You know two invocations of your choice, three at 5th level, four at 7th, five at 9th, six at 12th, seven at 15th, and eight at 18th. When you gain a warlock level, you can replace one invocation you know with another.",
                ),
            ),
            {
                level: 3,
                features: [
                    feature(
                        "Pact Boon",
                        "Your otherworldly patron bestows a gift upon you for your loyal service. You gain one of the following features of your choice.",
                    ),
                ],
                grants: {
                    options: [
                        {
                            id: "pact-boon",
                            name: "Pact Boon",
                            options: [
                                {
                                    id: "chain",
                                    name: "Pact of the Chain",
                                    description:
                                        "You learn the find familiar spell and can cast it as a ritual. When you cast it, you can choose an imp, pseudodragon, quasit, or sprite as your familiar. When you take the Attack action, you can forgo one of your own attacks to allow your familiar to make one attack of its own with its reaction.",
                                },
                                {
                                    id: "blade",
                                    name: "Pact of the Blade",
                                    description:
                                        "You can use your action to create a pact weapon in your empty hand. You choose the form that this melee weapon takes each time you create it, you are proficient with it while you wield it, and it counts as magical. You can also transform a magic weapon into your pact weapon by performing a special ritual.",
                                },
                                {
                                    id: "tome",
                                    name: "Pact of the Tome",
                                    description:
                                        "Your patron gives you a grimoire called a Book of Shadows. Choose three cantrips from any class's spell list. While the book is on your person, you can cast those cantrips at will. They count as warlock spells for you.",
                                },
                            ],
                        },
                    ],
                },
            },
            asi(4),
            asi(8),
            at(
                11,
                feature(
                    "Mystic Arcanum",
                    "Your patron bestows upon you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast it once without expending a spell slot, regaining the ability when you finish a long rest. You gain another arcanum of 7th level at 13th level, 8th level at 15th level, and 9th level at 17th level.",
                ),
            ),
            asi(12),
            asi(16),
            asi(19),
            at(
                20,
                feature(
                    "Eldritch Master",
                    "You can draw on your inner reserve of mystical power while entreating your patron to regain expended spell slots. You can spend 1 minute entreating your patron for aid to regain all your expended spell slots from your Pact Magic feature. Once you regain spell slots with this feature, you must finish a long rest before you can do so again.",
                ),
            ),
        ],
    },
);

export const fiend = subclass(
    "fiend",
    "You have made a pact with a fiend from the lower planes of existence, a being whose aims are evil.",
    {
        class: "warlock",
        name: "The Fiend",
        source: SOURCE,
        levels: [
            {
                level: 1,
                features: [],
                grants: {
                    expandedSpells: [
                        "burning-hands",
                        "command",
                        "blindness-deafness",
                        "scorching-ray",
                        "fireball",
                        "stinking-cloud",
                        "fire-shield",
                        "wall-of-fire",
                        "flame-strike",
                        "hallow",
                    ],
                },
            },
            at(
                1,
                feature(
                    "Expanded Spell List",
                    "The following spells are added to the warlock spell list for you: burning hands and command (1st), blindness/deafness and scorching ray (2nd), fireball and stinking cloud (3rd), fire shield and wall of fire (4th), flame strike and hallow (5th).",
                ),
                feature(
                    "Dark One's Blessing",
                    "When you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum of 1).",
                ),
            ),
            at(
                6,
                feature(
                    "Dark One's Own Luck",
                    "When you make an ability check or a saving throw, you can use this feature to add a d10 to your roll. You can do so after seeing the initial roll but before any of the roll's effects occur. Once you use this feature, you can't use it again until you finish a short or long rest.",
                ),
            ),
            at(
                10,
                feature(
                    "Fiendish Resilience",
                    "You can choose one damage type when you finish a short or long rest. You gain resistance to that damage type until you choose a different one with this feature. Damage from magical weapons or silver weapons ignores this resistance.",
                ),
            ),
            at(
                14,
                feature(
                    "Hurl Through Hell",
                    "When you hit a creature with an attack, you can use this feature to instantly transport the target through the lower planes. The creature disappears and hurtles through a nightmare landscape. At the end of your next turn, the target returns to the space it previously occupied, or the nearest unoccupied space. If the target is not a fiend, it takes 10d10 psychic damage. Once you use this feature, you can't use it again until you finish a long rest.",
                ),
            ),
        ],
    },
);
