import { simpleWeapons } from "../items/index.ts";

import {
    anyOf,
    asi,
    at,
    characterClass,
    EXPERTISE_DESCRIPTION,
    feature,
    instruments,
    item,
    line,
    SOURCE,
    steps,
    subclass,
} from "./helpers.ts";

const MAGICAL_SECRETS =
    "You have plundered magical knowledge from a wide spectrum of disciplines. Choose two spells from any class, including this one. A spell you choose must be of a level you can cast, as shown on the Bard table, or a cantrip. The chosen spells count as bard spells for you and are included in the number of bard spells you know.";

export const bard = characterClass("bard", "An inspiring magician whose power echoes the music of creation.", {
    name: "Bard",
    source: SOURCE,
    hitDie: 8,
    savingThrows: ["dexterity", "charisma"],
    armor: ["light-armor"],
    weapons: ["simple-weapons", "hand-crossbow", "longsword", "rapier", "shortsword"],
    tools: [{ id: "instruments", count: 3, from: instruments }],
    skills: [{ id: "skills", count: 3 }],
    multiclass: {
        armor: ["light-armor"],
        skills: [{ id: "multiclass-skill", count: 1 }],
        tools: [{ id: "multiclass-instrument", count: 1, from: instruments }],
    },
    subclassLevel: 3,
    subclassTitle: "Bard College",
    equipment: [
        line(
            "(a) a rapier, (b) a longsword, or (c) any simple weapon",
            [item("rapier")],
            [item("longsword")],
            [anyOf(simpleWeapons)],
        ),
        line(
            "(a) a diplomat's pack or (b) an entertainer's pack",
            [item("diplomats-pack")],
            [item("entertainers-pack")],
        ),
        line(
            "(a) a lute or (b) any other musical instrument",
            [item("lute")],
            [anyOf(instruments.filter((id) => id !== "lute"))],
        ),
        line("Leather armor and a dagger", [item("leather"), item("dagger")]),
    ],
    spellcasting: {
        ability: "charisma",
        progression: "full",
        preparation: "known",
        cantripsKnown: steps({ 1: 2, 4: 3, 10: 4 }),
        spellsKnown: steps({
            1: 4,
            2: 5,
            3: 6,
            4: 7,
            5: 8,
            6: 9,
            7: 10,
            8: 11,
            9: 12,
            10: 14,
            11: 15,
            13: 16,
            14: 18,
            15: 19,
            17: 20,
            18: 22,
        }),
    },
    levels: [
        at(
            1,
            feature(
                "Spellcasting",
                "You have learned to untangle and reshape the fabric of reality in harmony with your wishes and music. Charisma is your spellcasting ability for your bard spells, and you can use a musical instrument as a spellcasting focus.",
            ),
            feature(
                "Bardic Inspiration",
                "You can inspire others through stirring words or music. As a bonus action, choose one creature other than yourself within 60 feet who can hear you. That creature gains a Bardic Inspiration die, a d6, which it can add to one ability check, attack roll, or saving throw within the next 10 minutes. You can use this feature a number of times equal to your Charisma modifier (minimum of once) per long rest. The die becomes a d8 at 5th level, a d10 at 10th level, and a d12 at 15th level.",
            ),
        ),
        at(
            2,
            feature(
                "Jack of All Trades",
                "You can add half your proficiency bonus, rounded down, to any ability check you make that doesn't already include your proficiency bonus.",
            ),
            feature(
                "Song of Rest",
                "You can use soothing music or oration to help revitalize your wounded allies during a short rest. If you or any friendly creatures who can hear your performance regain hit points at the end of the short rest by spending one or more Hit Dice, each of those creatures regains an extra 1d6 hit points. The extra hit points increase to 1d8 at 9th level, 1d10 at 13th level, and 1d12 at 17th level.",
            ),
        ),
        {
            level: 3,
            features: [
                feature(
                    "Bard College",
                    "You delve into the advanced techniques of a bard college of your choice. Your choice grants you features at 3rd level and again at 6th and 14th level.",
                ),
                feature("Expertise", EXPERTISE_DESCRIPTION),
            ],
            grants: { expertise: [{ id: "expertise-3", count: 2 }] },
        },
        asi(4),
        at(
            5,
            feature(
                "Font of Inspiration",
                "You regain all of your expended uses of Bardic Inspiration when you finish a short or long rest.",
            ),
        ),
        at(
            6,
            feature(
                "Countercharm",
                "As an action, you can start a performance that lasts until the end of your next turn. During that time, you and any friendly creatures within 30 feet of you have advantage on saving throws against being frightened or charmed. A creature must be able to hear you to gain this benefit.",
            ),
        ),
        asi(8),
        {
            level: 10,
            features: [feature("Expertise", EXPERTISE_DESCRIPTION), feature("Magical Secrets", MAGICAL_SECRETS)],
            grants: { expertise: [{ id: "expertise-10", count: 2 }] },
        },
        asi(12),
        at(14, feature("Magical Secrets", MAGICAL_SECRETS)),
        asi(16),
        at(18, feature("Magical Secrets", MAGICAL_SECRETS)),
        asi(19),
        at(
            20,
            feature(
                "Superior Inspiration",
                "When you roll initiative and have no uses of Bardic Inspiration left, you regain one use.",
            ),
        ),
    ],
});

export const lore = subclass(
    "lore",
    "Bards of the College of Lore know something about most things, collecting bits of knowledge from every source.",
    {
        class: "bard",
        name: "College of Lore",
        source: SOURCE,
        levels: [
            {
                level: 3,
                features: [
                    feature("Bonus Proficiencies", "You gain proficiency with three skills of your choice."),
                    feature(
                        "Cutting Words",
                        "When a creature that you can see within 60 feet of you makes an attack roll, an ability check, or a damage roll, you can use your reaction to expend one of your uses of Bardic Inspiration, rolling the die and subtracting the number rolled from the creature's roll. You can choose to use this feature after the creature makes its roll, but before the GM determines the outcome. The creature is immune if it can't hear you or if it's immune to being charmed.",
                    ),
                ],
                grants: { skills: [{ id: "bonus-proficiencies", count: 3 }] },
            },
            {
                level: 6,
                features: [
                    feature(
                        "Additional Magical Secrets",
                        "You learn two spells of your choice from any class. A spell you choose must be of a level you can cast, as shown on the Bard table, or a cantrip. The chosen spells count as bard spells for you but don't count against the number of bard spells you know.",
                    ),
                ],
                grants: { spells: [{ id: "additional-magical-secrets", count: 2 }] },
            },
            at(
                14,
                feature(
                    "Peerless Skill",
                    "When you make an ability check, you can expend one use of Bardic Inspiration. Roll a Bardic Inspiration die and add the number rolled to your ability check. You can choose to do so after you roll the die for the ability check, but before the GM tells you whether you succeed or fail.",
                ),
            ),
        ],
    },
);
