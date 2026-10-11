import type { ClassLevel } from "../../types/class.ts";
import { holySymbols, simpleWeapons } from "../items/index.ts";

import { anyOf, asi, characterClass, feature, item, line, SOURCE, spellsAt, steps, subclass } from "./helpers.ts";

function destroyUndead(level: number, rating: string): ClassLevel {
    return {
        level,
        features: [
            feature(
                "Destroy Undead",
                `When an undead fails its saving throw against your Turn Undead feature, the creature is instantly destroyed if its challenge rating is at or below ${rating}.`,
            ),
        ],
    };
}

const cleric = characterClass("cleric", "A priestly champion who wields divine magic in service of a higher power.", {
    name: "Cleric",
    source: SOURCE,
    hitDie: 8,
    savingThrows: ["wisdom", "charisma"],
    armor: ["light-armor", "medium-armor", "shields"],
    weapons: ["simple-weapons"],
    skills: [{ id: "skills", count: 2, from: ["history", "insight", "medicine", "persuasion", "religion"] }],
    multiclass: { armor: ["light-armor", "medium-armor", "shields"] },
    subclassLevel: 1,
    subclassTitle: "Divine Domain",
    equipment: [
        line("(a) a mace or (b) a warhammer (if proficient)", [item("mace")], [item("warhammer")]),
        line(
            "(a) scale mail, (b) leather armor, or (c) chain mail (if proficient)",
            [item("scale-mail")],
            [item("leather")],
            [item("chain-mail")],
        ),
        line(
            "(a) a light crossbow and 20 bolts or (b) any simple weapon",
            [item("light-crossbow"), item("crossbow-bolt", 20)],
            [anyOf(simpleWeapons)],
        ),
        line("(a) a priest's pack or (b) an explorer's pack", [item("priests-pack")], [item("explorers-pack")]),
        line("A shield and a holy symbol", [item("shield"), anyOf(holySymbols)]),
    ],
    spellcasting: {
        ability: "wisdom",
        progression: "full",
        preparation: "prepared",
        cantripsKnown: steps({ 1: 3, 4: 4, 10: 5 }),
        preparedLevelFactor: 1,
    },
    levels: [
        {
            level: 1,
            features: [
                feature(
                    "Spellcasting",
                    "As a conduit for divine power, you can cast cleric spells. Wisdom is your spellcasting ability for your cleric spells. You prepare a number of cleric spells equal to your Wisdom modifier + your cleric level (minimum of one) after each long rest, and you can cast any cleric spell you have prepared as a ritual if it has the ritual tag.",
                ),
                feature(
                    "Divine Domain",
                    "Choose one domain related to your deity. Your choice grants you domain spells and other features when you choose it at 1st level, and additional ways to use Channel Divinity at 2nd level, plus further benefits at 6th, 8th, and 17th levels.",
                ),
            ],
        },
        {
            level: 2,
            features: [
                feature(
                    "Channel Divinity",
                    "You gain the ability to channel divine energy directly from your deity, using that energy to fuel magical effects. You start with Turn Undead and an effect determined by your domain. You must finish a short or long rest to use it again. You can use it twice between rests from 6th level and three times from 18th level.",
                ),
                feature(
                    "Turn Undead",
                    "As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead that can see or hear you within 30 feet of you must make a Wisdom saving throw. If the creature fails its saving throw, it is turned for 1 minute or until it takes any damage.",
                ),
            ],
        },
        asi(4),
        destroyUndead(5, "1/2"),
        asi(8),
        destroyUndead(8, "1"),
        {
            level: 10,
            features: [
                feature(
                    "Divine Intervention",
                    "You can call on your deity to intervene on your behalf when your need is great. Describe the assistance you seek, and roll percentile dice. If you roll a number equal to or lower than your cleric level, your deity intervenes. If your deity intervenes, you can't use this feature again for 7 days. Otherwise, you can use it again after you finish a long rest.",
                ),
            ],
        },
        destroyUndead(11, "2"),
        asi(12),
        destroyUndead(14, "3"),
        asi(16),
        destroyUndead(17, "4"),
        asi(19),
        {
            level: 20,
            features: [
                feature(
                    "Divine Intervention Improvement",
                    "Your call for intervention succeeds automatically, no roll required.",
                ),
            ],
        },
    ],
});

const life = subclass("life", "The Life domain focuses on the vibrant positive energy that sustains all life.", {
    class: "cleric",
    name: "Life Domain",
    source: SOURCE,
    levels: [
        {
            level: 1,
            features: [
                feature(
                    "Domain Spells",
                    "You always have certain spells prepared: bless and cure wounds at 1st level, lesser restoration and spiritual weapon at 3rd, beacon of hope and revivify at 5th, death ward and guardian of faith at 7th, and mass cure wounds and raise dead at 9th.",
                ),
                feature("Bonus Proficiency", "You gain proficiency with heavy armor."),
                feature(
                    "Disciple of Life",
                    "Whenever you use a spell of 1st level or higher to restore hit points to a creature, the creature regains additional hit points equal to 2 + the spell's level.",
                ),
            ],
            grants: { armor: ["heavy-armor"], spells: ["bless", "cure-wounds"] },
        },
        spellsAt(3, "lesser-restoration", "spiritual-weapon"),
        spellsAt(5, "beacon-of-hope", "revivify"),
        spellsAt(7, "death-ward", "guardian-of-faith"),
        spellsAt(9, "mass-cure-wounds", "raise-dead"),
        {
            level: 2,
            features: [
                feature(
                    "Channel Divinity: Preserve Life",
                    "As an action, you present your holy symbol and evoke healing energy that can restore a number of hit points equal to five times your cleric level. Choose any creatures within 30 feet of you, and divide those hit points among them. This feature can restore a creature to no more than half of its hit point maximum. You can't use this feature on an undead or a construct.",
                ),
            ],
        },
        {
            level: 6,
            features: [
                feature(
                    "Blessed Healer",
                    "The healing spells you cast on others heal you as well. When you cast a spell of 1st level or higher that restores hit points to a creature other than you, you regain hit points equal to 2 + the spell's level.",
                ),
            ],
        },
        {
            level: 8,
            features: [
                feature(
                    "Divine Strike",
                    "Once on each of your turns when you hit a creature with a weapon attack, you can cause the attack to deal an extra 1d8 radiant damage to the target. When you reach 14th level, the extra damage increases to 2d8.",
                ),
            ],
        },
        {
            level: 17,
            features: [
                feature(
                    "Supreme Healing",
                    "When you would normally roll one or more dice to restore hit points with a spell, you instead use the highest number possible for each die.",
                ),
            ],
        },
    ],
});
export { cleric, life };
