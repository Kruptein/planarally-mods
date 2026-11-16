import { asi, characterClass, EXPERTISE_DESCRIPTION, feature, item, line, SOURCE, subclass } from "./helpers.ts";

const rogueSkills = [
    "acrobatics",
    "athletics",
    "deception",
    "insight",
    "intimidation",
    "investigation",
    "perception",
    "performance",
    "persuasion",
    "sleight-of-hand",
    "stealth",
];

const rogue = characterClass("rogue", "A scoundrel who uses stealth and trickery to overcome obstacles and enemies.", {
    name: "Rogue",
    source: SOURCE,
    hitDie: 8,
    savingThrows: ["dexterity", "intelligence"],
    armor: ["light-armor"],
    weapons: ["simple-weapons", "hand-crossbow", "longsword", "rapier", "shortsword"],
    tools: ["thieves-tools"],
    skills: [{ id: "skills", count: 4, from: rogueSkills }],
    multiclass: {
        armor: ["light-armor"],
        tools: ["thieves-tools"],
        skills: [{ id: "multiclass-skill", count: 1, from: rogueSkills }],
    },
    subclassLevel: 3,
    subclassTitle: "Roguish Archetype",
    equipment: [
        line("(a) a rapier or (b) a shortsword", [item("rapier")], [item("shortsword")]),
        line(
            "(a) a shortbow and quiver of 20 arrows or (b) a shortsword",
            [item("shortbow"), item("quiver"), item("arrow", 20)],
            [item("shortsword")],
        ),
        line(
            "(a) a burglar's pack, (b) a dungeoneer's pack, or (c) an explorer's pack",
            [item("burglars-pack")],
            [item("dungeoneers-pack")],
            [item("explorers-pack")],
        ),
        line("Leather armor, two daggers, and thieves' tools", [
            item("leather"),
            item("dagger", 2),
            item("thieves-tools"),
        ]),
    ],
    levels: [
        {
            level: 1,
            features: [
                feature("Expertise", EXPERTISE_DESCRIPTION),
                feature(
                    "Sneak Attack",
                    "Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon. You don't need advantage if another enemy of the target is within 5 feet of it, that enemy isn't incapacitated, and you don't have disadvantage on the attack roll. The extra damage increases by 1d6 at every odd rogue level: 2d6 at 3rd, 3d6 at 5th, up to 10d6 at 19th level.",
                ),
                feature(
                    "Thieves' Cant",
                    "You know thieves' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation. Only another creature that knows thieves' cant understands such messages.",
                ),
            ],
            grants: { expertise: [{ id: "expertise-1", count: 2 }] },
        },
        {
            level: 2,
            features: [
                feature(
                    "Cunning Action",
                    "You can take a bonus action on each of your turns in combat. This action can be used only to take the Dash, Disengage, or Hide action.",
                ),
            ],
        },
        {
            level: 3,
            features: [
                feature(
                    "Roguish Archetype",
                    "You choose an archetype that you emulate in the exercise of your rogue abilities. The archetype grants you features at 3rd level and then again at 9th, 13th, and 17th level.",
                ),
            ],
        },
        asi(4),
        {
            level: 5,
            features: [
                feature(
                    "Uncanny Dodge",
                    "When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you.",
                ),
            ],
        },
        {
            level: 6,
            features: [feature("Expertise", EXPERTISE_DESCRIPTION)],
            grants: { expertise: [{ id: "expertise-6", count: 2 }] },
        },
        {
            level: 7,
            features: [
                feature(
                    "Evasion",
                    "When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.",
                ),
            ],
        },
        asi(8),
        asi(10),
        {
            level: 11,
            features: [
                feature(
                    "Reliable Talent",
                    "Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10.",
                ),
            ],
        },
        asi(12),
        {
            level: 14,
            features: [
                feature(
                    "Blindsense",
                    "If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.",
                ),
            ],
        },
        {
            level: 15,
            features: [feature("Slippery Mind", "You gain proficiency in Wisdom saving throws.")],
            grants: { savingThrows: ["wisdom"] },
        },
        asi(16),
        {
            level: 18,
            features: [feature("Elusive", "No attack roll has advantage against you while you aren't incapacitated.")],
        },
        asi(19),
        {
            level: 20,
            features: [
                feature(
                    "Stroke of Luck",
                    "If your attack misses a target within range, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20. Once you use this feature, you can't use it again until you finish a short or long rest.",
                ),
            ],
        },
    ],
});

const thief = subclass(
    "thief",
    "You hone your skills in the larcenous arts: burglars, bandits, cutpurses, and other criminals.",
    {
        class: "rogue",
        name: "Thief",
        source: SOURCE,
        levels: [
            {
                level: 3,
                features: [
                    feature(
                        "Fast Hands",
                        "You can use the bonus action granted by your Cunning Action to make a Dexterity (Sleight of Hand) check, use your thieves' tools to disarm a trap or open a lock, or take the Use an Object action.",
                    ),
                    feature(
                        "Second-Story Work",
                        "Climbing no longer costs you extra movement. In addition, when you make a running jump, the distance you cover increases by a number of feet equal to your Dexterity modifier.",
                    ),
                ],
            },
            {
                level: 9,
                features: [
                    feature(
                        "Supreme Sneak",
                        "You have advantage on a Dexterity (Stealth) check if you move no more than half your speed on the same turn.",
                    ),
                ],
            },
            {
                level: 13,
                features: [
                    feature(
                        "Use Magic Device",
                        "You ignore all class, race, and level requirements on the use of magic items.",
                    ),
                ],
            },
            {
                level: 17,
                features: [
                    feature(
                        "Thief's Reflexes",
                        "You can take two turns during the first round of any combat. You take your first turn at your normal initiative and your second turn at your initiative minus 10. You can't use this feature when you are surprised.",
                    ),
                ],
            },
        ],
    },
);
export { rogue, thief };
