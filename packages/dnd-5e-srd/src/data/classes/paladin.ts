import { holySymbols, martialWeapons, simpleMeleeWeapons } from "../items/index.ts";

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
    spellsAt,
    subclass,
} from "./helpers.ts";

export const paladin = characterClass("paladin", "A holy warrior bound to a sacred oath.", {
    name: "Paladin",
    source: SOURCE,
    hitDie: 10,
    savingThrows: ["wisdom", "charisma"],
    armor: ["light-armor", "medium-armor", "heavy-armor", "shields"],
    weapons: ["simple-weapons", "martial-weapons"],
    skills: [
        {
            id: "skills",
            count: 2,
            from: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"],
        },
    ],
    multiclass: {
        armor: ["light-armor", "medium-armor", "shields"],
        weapons: ["simple-weapons", "martial-weapons"],
    },
    subclassLevel: 3,
    subclassTitle: "Sacred Oath",
    equipment: [
        line(
            "(a) a martial weapon and a shield or (b) two martial weapons",
            [anyOf(martialWeapons), item("shield")],
            [anyOf(martialWeapons), anyOf(martialWeapons)],
        ),
        line("(a) five javelins or (b) any simple melee weapon", [item("javelin", 5)], [anyOf(simpleMeleeWeapons)]),
        line("(a) a priest's pack or (b) an explorer's pack", [item("priests-pack")], [item("explorers-pack")]),
        line("Chain mail and a holy symbol", [item("chain-mail"), anyOf(holySymbols)]),
    ],
    spellcasting: {
        ability: "charisma",
        progression: "half",
        preparation: "prepared",
        preparedLevelFactor: 0.5,
    },
    levels: [
        at(
            1,
            feature(
                "Divine Sense",
                "As an action, you can open your awareness to detect strong evil and powerful good. Until the end of your next turn, you know the location of any celestial, fiend, or undead within 60 feet of you that is not behind total cover. You can use this feature a number of times equal to 1 + your Charisma modifier per long rest.",
            ),
            feature(
                "Lay on Hands",
                "You have a pool of healing power that replenishes when you take a long rest. With that pool, you can restore a total number of hit points equal to your paladin level × 5. As an action, you can touch a creature and draw power from the pool to restore hit points, or expend 5 hit points from the pool to cure the target of one disease or neutralize one poison. This feature has no effect on undead and constructs.",
            ),
        ),
        fightingStyle(2, "fighting-style", "defense", "dueling", "great-weapon-fighting", "protection"),
        at(
            2,
            feature(
                "Spellcasting",
                "You have learned to draw on divine magic through meditation and prayer to cast spells as a cleric does. Charisma is your spellcasting ability for your paladin spells, and you can use a holy symbol as a spellcasting focus.",
            ),
            feature(
                "Divine Smite",
                "When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon's damage. The extra damage is 2d8 for a 1st-level spell slot, plus 1d8 for each spell level higher than 1st, to a maximum of 5d8. The damage increases by 1d8 if the target is an undead or a fiend.",
            ),
        ),
        at(
            3,
            feature("Divine Health", "The divine magic flowing through you makes you immune to disease."),
            feature(
                "Sacred Oath",
                "You swear the oath that binds you as a paladin forever. Your choice grants you features at 3rd level and again at 7th, 15th, and 20th level, including oath spells and Channel Divinity options.",
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
        at(
            6,
            feature(
                "Aura of Protection",
                "Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your Charisma modifier (with a minimum bonus of +1). You must be conscious to grant this bonus. At 18th level, the range of this aura increases to 30 feet.",
            ),
        ),
        asi(8),
        at(
            10,
            feature(
                "Aura of Courage",
                "You and friendly creatures within 10 feet of you can't be frightened while you are conscious. At 18th level, the range of this aura increases to 30 feet.",
            ),
        ),
        at(
            11,
            feature(
                "Improved Divine Smite",
                "Whenever you hit a creature with a melee weapon, the creature takes an extra 1d8 radiant damage. If you also use your Divine Smite with an attack, you add this damage to the extra damage of your Divine Smite.",
            ),
        ),
        asi(12),
        at(
            14,
            feature(
                "Cleansing Touch",
                "You can use your action to end one spell on yourself or on one willing creature that you touch. You can use this feature a number of times equal to your Charisma modifier (a minimum of once) per long rest.",
            ),
        ),
        asi(16),
        at(
            18,
            feature(
                "Aura Improvements",
                "The range of your Aura of Protection and Aura of Courage increases to 30 feet.",
            ),
        ),
        asi(19),
    ],
});

export const devotion = subclass(
    "devotion",
    "The Oath of Devotion binds a paladin to the loftiest ideals of justice, virtue, and order.",
    {
        class: "paladin",
        name: "Oath of Devotion",
        source: SOURCE,
        levels: [
            at(
                3,
                feature(
                    "Tenets of Devotion",
                    "Honesty: don't lie or cheat. Courage: never fear to act, though caution is wise. Compassion: aid others, protect the weak, and punish those who threaten them. Honor: treat others with fairness, and let your honorable deeds be an example to them. Duty: be responsible for your actions and their consequences, protect those entrusted to your care, and obey those who have just authority over you.",
                ),
                feature(
                    "Oath Spells",
                    "You always have these spells prepared: protection from evil and good and sanctuary at 3rd level, lesser restoration and zone of truth at 5th, beacon of hope and dispel magic at 9th, freedom of movement and guardian of faith at 13th, and commune and flame strike at 17th.",
                ),
                feature(
                    "Channel Divinity",
                    "You can use your Channel Divinity once per short or long rest. Sacred Weapon: as an action, imbue one weapon you are holding with positive energy for 1 minute, adding your Charisma modifier to attack rolls made with it (minimum +1); it sheds bright light in a 20-foot radius and counts as magical. Turn the Unholy: as an action, each fiend or undead that can see or hear you within 30 feet must make a Wisdom saving throw or be turned for 1 minute or until it takes damage.",
                ),
            ),
            spellsAt(3, "protection-from-evil-and-good", "sanctuary"),
            spellsAt(5, "lesser-restoration", "zone-of-truth"),
            spellsAt(9, "beacon-of-hope", "dispel-magic"),
            spellsAt(13, "freedom-of-movement", "guardian-of-faith"),
            spellsAt(17, "commune", "flame-strike"),
            at(
                7,
                feature(
                    "Aura of Devotion",
                    "You and friendly creatures within 10 feet of you can't be charmed while you are conscious. At 18th level, the range of this aura increases to 30 feet.",
                ),
            ),
            at(
                15,
                feature(
                    "Purity of Spirit",
                    "You are always under the effects of a protection from evil and good spell.",
                ),
            ),
            at(
                20,
                feature(
                    "Holy Nimbus",
                    "As an action, you can emanate an aura of sunlight for 1 minute. Bright light shines from you in a 30-foot radius, and dim light shines 30 feet beyond that. Whenever an enemy creature starts its turn in the bright light, the creature takes 10 radiant damage. In addition, you have advantage on saving throws against spells cast by fiends or undead. Once you use this feature, you can't use it again until you finish a long rest.",
                ),
            ),
        ],
    },
);
