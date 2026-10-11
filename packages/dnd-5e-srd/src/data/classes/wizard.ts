import { arcaneFoci } from "../items/index.ts";

import { anyOf, asi, at, characterClass, feature, item, line, SOURCE, steps, subclass } from "./helpers.ts";

export const wizard = characterClass(
    "wizard",
    "A scholarly magic-user capable of manipulating the structures of reality.",
    {
        name: "Wizard",
        source: SOURCE,
        hitDie: 6,
        savingThrows: ["intelligence", "wisdom"],
        weapons: ["dagger", "dart", "sling", "quarterstaff", "light-crossbow"],
        skills: [
            {
                id: "skills",
                count: 2,
                from: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
            },
        ],
        multiclass: {},
        subclassLevel: 2,
        subclassTitle: "Arcane Tradition",
        equipment: [
            line("(a) a quarterstaff or (b) a dagger", [item("quarterstaff")], [item("dagger")]),
            line("(a) a component pouch or (b) an arcane focus", [item("component-pouch")], [anyOf(arcaneFoci)]),
            line("(a) a scholar's pack or (b) an explorer's pack", [item("scholars-pack")], [item("explorers-pack")]),
            line("A spellbook", [item("spellbook")]),
        ],
        spellcasting: {
            ability: "intelligence",
            progression: "full",
            preparation: "spellbook",
            cantripsKnown: steps({ 1: 3, 4: 4, 10: 5 }),
            // Six spells at 1st level and two more per level, not counting copied spells
            spellsKnown: Array.from({ length: 20 }, (_, index) => 6 + 2 * index),
            preparedLevelFactor: 1,
        },
        levels: [
            at(
                1,
                feature(
                    "Spellcasting",
                    "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. Intelligence is your spellcasting ability for your wizard spells, and you can use an arcane focus as a spellcasting focus. You prepare a number of wizard spells equal to your Intelligence modifier + your wizard level (minimum of one) from your spellbook after each long rest.",
                ),
                feature(
                    "Arcane Recovery",
                    "Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.",
                ),
            ),
            at(
                2,
                feature(
                    "Arcane Tradition",
                    "You choose an arcane tradition, shaping your practice of magic. Your choice grants you features at 2nd level and again at 6th, 10th, and 14th level.",
                ),
            ),
            asi(4),
            asi(8),
            asi(12),
            asi(16),
            at(
                18,
                feature(
                    "Spell Mastery",
                    "Choose a 1st-level wizard spell and a 2nd-level wizard spell that are in your spellbook. You can cast those spells at their lowest level without expending a spell slot when you have them prepared. By spending 8 hours in study, you can exchange one or both of the spells you chose for different spells of the same levels.",
                ),
            ),
            asi(19),
            at(
                20,
                feature(
                    "Signature Spells",
                    "Choose two 3rd-level wizard spells in your spellbook as your signature spells. You always have these spells prepared, they don't count against the number of spells you have prepared, and you can cast each of them once at 3rd level without expending a spell slot. When you do so, you can't do so again until you finish a short or long rest.",
                ),
            ),
        ],
    },
);

export const evocation = subclass(
    "evocation",
    "You focus your study on magic that creates powerful elemental effects such as bitter cold, searing flame, and rolling thunder.",
    {
        class: "wizard",
        name: "School of Evocation",
        source: SOURCE,
        levels: [
            at(
                2,
                feature(
                    "Evocation Savant",
                    "The gold and time you must spend to copy an evocation spell into your spellbook is halved.",
                ),
                feature(
                    "Sculpt Spells",
                    "You can create pockets of relative safety within the effects of your evocation spells. When you cast an evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 + the spell's level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save.",
                ),
            ),
            at(
                6,
                feature(
                    "Potent Cantrip",
                    "Your damaging cantrips affect even creatures that avoid the brunt of the effect. When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip's damage (if any) but suffers no additional effect from the cantrip.",
                ),
            ),
            at(
                10,
                feature(
                    "Empowered Evocation",
                    "You can add your Intelligence modifier to one damage roll of any wizard evocation spell you cast.",
                ),
            ),
            at(
                14,
                feature(
                    "Overchannel",
                    "When you cast a wizard spell of 1st through 5th level that deals damage, you can deal maximum damage with that spell. The first time you do so, you suffer no adverse effect. If you use this feature again before you finish a long rest, you take 2d12 necrotic damage for each level of the spell above 1st level immediately after you cast it. Each time you use this feature again before finishing a long rest, the necrotic damage per spell level increases by 1d12. This damage ignores resistance and immunity.",
                ),
            ),
        ],
    },
);
