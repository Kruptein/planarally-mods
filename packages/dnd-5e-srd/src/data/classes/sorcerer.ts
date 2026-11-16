import type { ClassLevel } from "../../types/class.ts";
import type { ChoiceOption, OptionChoice } from "../../types/grants.ts";
import { arcaneFoci, simpleWeapons } from "../items/index.ts";

import { anyOf, asi, at, characterClass, feature, item, line, SOURCE, steps, subclass } from "./helpers.ts";

const metamagicOptions: ChoiceOption[] = [
    {
        id: "careful",
        name: "Careful Spell",
        description:
            "When you cast a spell that forces other creatures to make a saving throw, you can spend 1 sorcery point and choose a number of those creatures up to your Charisma modifier (minimum of one). A chosen creature automatically succeeds on its saving throw against the spell.",
    },
    {
        id: "distant",
        name: "Distant Spell",
        description:
            "When you cast a spell that has a range of 5 feet or greater, you can spend 1 sorcery point to double the range of the spell. When you cast a spell that has a range of touch, you can spend 1 sorcery point to make the range of the spell 30 feet.",
    },
    {
        id: "empowered",
        name: "Empowered Spell",
        description:
            "When you roll damage for a spell, you can spend 1 sorcery point to reroll a number of the damage dice up to your Charisma modifier (minimum of one). You must use the new rolls. You can use Empowered Spell even if you have already used a different Metamagic option during the casting of the spell.",
    },
    {
        id: "extended",
        name: "Extended Spell",
        description:
            "When you cast a spell that has a duration of 1 minute or longer, you can spend 1 sorcery point to double its duration, to a maximum duration of 24 hours.",
    },
    {
        id: "heightened",
        name: "Heightened Spell",
        description:
            "When you cast a spell that forces a creature to make a saving throw to resist its effects, you can spend 3 sorcery points to give one target of the spell disadvantage on its first saving throw made against the spell.",
    },
    {
        id: "quickened",
        name: "Quickened Spell",
        description:
            "When you cast a spell that has a casting time of 1 action, you can spend 2 sorcery points to change the casting time to 1 bonus action for this casting.",
    },
    {
        id: "subtle",
        name: "Subtle Spell",
        description:
            "When you cast a spell, you can spend 1 sorcery point to cast it without any somatic or verbal components.",
    },
    {
        id: "twinned",
        name: "Twinned Spell",
        description:
            "When you cast a spell that targets only one creature and doesn't have a range of self, you can spend a number of sorcery points equal to the spell's level to target a second creature in range with the same spell (1 sorcery point if the spell is a cantrip).",
    },
];

function metamagic(id: string): OptionChoice {
    return { id, name: "Metamagic", options: metamagicOptions };
}

const METAMAGIC =
    "You gain the ability to twist your spells to suit your needs. You gain two Metamagic options of your choice, and another one at 10th and 17th level. You can use only one Metamagic option on a spell when you cast it, unless otherwise noted.";

function moreMetamagic(level: number): ClassLevel {
    return {
        level,
        features: [feature("Metamagic", "You gain another Metamagic option of your choice.")],
        grants: { options: [metamagic(`metamagic-${level}`)] },
    };
}

export const sorcerer = characterClass(
    "sorcerer",
    "A spellcaster who draws on inherent magic from a gift or bloodline.",
    {
        name: "Sorcerer",
        source: SOURCE,
        hitDie: 6,
        savingThrows: ["constitution", "charisma"],
        weapons: ["dagger", "dart", "sling", "quarterstaff", "light-crossbow"],
        skills: [
            {
                id: "skills",
                count: 2,
                from: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"],
            },
        ],
        multiclass: {},
        subclassLevel: 1,
        subclassTitle: "Sorcerous Origin",
        equipment: [
            line(
                "(a) a light crossbow and 20 bolts or (b) any simple weapon",
                [item("light-crossbow"), item("crossbow-bolt", 20)],
                [anyOf(simpleWeapons)],
            ),
            line("(a) a component pouch or (b) an arcane focus", [item("component-pouch")], [anyOf(arcaneFoci)]),
            line(
                "(a) a dungeoneer's pack or (b) an explorer's pack",
                [item("dungeoneers-pack")],
                [item("explorers-pack")],
            ),
            line("Two daggers", [item("dagger", 2)]),
        ],
        spellcasting: {
            ability: "charisma",
            progression: "full",
            preparation: "known",
            cantripsKnown: steps({ 1: 4, 4: 5, 10: 6 }),
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
                10: 11,
                11: 12,
                13: 13,
                15: 14,
                17: 15,
            }),
        },
        resources: [
            {
                id: "sorcery-points",
                name: "Sorcery Points",
                max: Array.from({ length: 20 }, (_, index) => (index === 0 ? 0 : index + 1)),
                recharge: "long",
            },
        ],
        levels: [
            at(
                1,
                feature(
                    "Spellcasting",
                    "An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. Charisma is your spellcasting ability for your sorcerer spells, and you can use an arcane focus as a spellcasting focus.",
                ),
                feature(
                    "Sorcerous Origin",
                    "Choose a sorcerous origin, which describes the source of your innate magical power. Your choice grants you features at 1st level and again at 6th, 14th, and 18th level.",
                ),
            ),
            at(
                2,
                feature(
                    "Font of Magic",
                    "You have a number of sorcery points equal to your sorcerer level, regained when you finish a long rest. As a bonus action, you can expend sorcery points to create a spell slot (2 points for 1st level, 3 for 2nd, 5 for 3rd, 6 for 4th, 7 for 5th, no higher than 5th), or expend a spell slot to gain sorcery points equal to the slot's level.",
                ),
            ),
            {
                level: 3,
                features: [feature("Metamagic", METAMAGIC)],
                grants: { options: [metamagic("metamagic-3a"), metamagic("metamagic-3b")] },
            },
            asi(4),
            asi(8),
            moreMetamagic(10),
            asi(12),
            asi(16),
            moreMetamagic(17),
            asi(19),
            at(
                20,
                feature(
                    "Sorcerous Restoration",
                    "You regain 4 expended sorcery points whenever you finish a short rest.",
                ),
            ),
        ],
    },
);

const dragonTypes: [id: string, name: string, damage: string][] = [
    ["black", "Black", "acid"],
    ["blue", "Blue", "lightning"],
    ["brass", "Brass", "fire"],
    ["bronze", "Bronze", "lightning"],
    ["copper", "Copper", "acid"],
    ["gold", "Gold", "fire"],
    ["green", "Green", "poison"],
    ["red", "Red", "fire"],
    ["silver", "Silver", "cold"],
    ["white", "White", "cold"],
];

export const draconic = subclass(
    "draconic",
    "Your innate magic comes from draconic magic that was mingled with your blood or that of your ancestors.",
    {
        class: "sorcerer",
        name: "Draconic Bloodline",
        source: SOURCE,
        levels: [
            {
                level: 1,
                features: [
                    feature(
                        "Dragon Ancestor",
                        "You choose one type of dragon as your ancestor. The damage type associated with each dragon is used by features you gain later. You can speak, read, and write Draconic. Additionally, whenever you make a Charisma check when interacting with dragons, your proficiency bonus is doubled if it applies to the check.",
                    ),
                    feature(
                        "Draconic Resilience",
                        "As magic flows through your body, it causes physical traits of your dragon ancestors to emerge. Your hit point maximum increases by 1 for each sorcerer level you have. Additionally, parts of your skin are covered by a thin sheen of dragon-like scales. When you aren't wearing armor, your AC equals 13 + your Dexterity modifier.",
                    ),
                ],
                grants: {
                    languages: ["draconic"],
                    unarmoredDefense: { base: 13, abilities: [], shield: true },
                    options: [
                        {
                            id: "dragon-ancestor",
                            name: "Dragon Ancestor",
                            options: dragonTypes.map(([id, name, damage]) => ({
                                id,
                                name,
                                description: `${name} dragon ancestry: ${damage} damage.`,
                            })),
                        },
                    ],
                },
            },
            at(
                6,
                feature(
                    "Elemental Affinity",
                    "When you cast a spell that deals damage of the type associated with your draconic ancestry, you can add your Charisma modifier to one damage roll of that spell. At the same time, you can spend 1 sorcery point to gain resistance to that damage type for 1 hour.",
                ),
            ),
            at(
                14,
                feature(
                    "Dragon Wings",
                    "You gain the ability to sprout a pair of dragon wings from your back, gaining a flying speed equal to your current speed. You can create these wings as a bonus action on your turn. They last until you dismiss them as a bonus action on your turn. You can't manifest your wings while wearing armor unless the armor is made to accommodate them.",
                ),
            ),
            at(
                18,
                feature(
                    "Draconic Presence",
                    "You can channel the dread presence of your dragon ancestor. As an action, you can spend 5 sorcery points to exude an aura of awe or fear (your choice) to a distance of 60 feet. For 1 minute or until you lose your concentration, each hostile creature that starts its turn in this aura must succeed on a Wisdom saving throw or be charmed (if you chose awe) or frightened (if you chose fear) until the aura ends.",
                ),
            ),
        ],
    },
);
