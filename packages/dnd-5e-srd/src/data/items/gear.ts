import type { CompendiumEntry } from "@planarally/mod-api";

import type { Item } from "../../types/item.ts";

import { cp, gear, gp, sp } from "./helpers.ts";

const ARCANE_FOCUS =
    "An arcane focus is a special item—an orb, a crystal, a rod, a specially constructed staff, a wand-like length of wood, or some similar item—designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus.";

const DRUIDIC_FOCUS =
    "A druidic focus might be a sprig of mistletoe or holly, a wand or scepter made of yew or another special wood, a staff drawn whole out of a living tree, or a totem object incorporating feathers, fur, bones, and teeth from sacred animals. A druid can use such an object as a spellcasting focus.";

const HOLY_SYMBOL =
    "A holy symbol is a representation of a god or pantheon. It might be an amulet depicting a symbol representing a deity, the same symbol carefully engraved or inlaid as an emblem on a shield, or a tiny box holding a fragment of a sacred relic. A cleric or paladin can use a holy symbol as a spellcasting focus. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.";

const AMMUNITION =
    "Ammunition for a weapon with the ammunition property. Half the ammunition used can be recovered after a battle by spending a minute searching the battlefield.";

export const gearItems: CompendiumEntry<Item>[] = [
    // Ammunition
    gear("arrow", { name: "Arrow", type: "ammunition", cost: gp(1), weight: 1, bundle: 20 }, AMMUNITION),
    gear(
        "blowgun-needle",
        { name: "Blowgun needle", type: "ammunition", cost: gp(1), weight: 1, bundle: 50 },
        AMMUNITION,
    ),
    gear(
        "crossbow-bolt",
        { name: "Crossbow bolt", type: "ammunition", cost: gp(1), weight: 1.5, bundle: 20 },
        AMMUNITION,
    ),
    gear(
        "sling-bullet",
        { name: "Sling bullet", type: "ammunition", cost: cp(4), weight: 1.5, bundle: 20 },
        AMMUNITION,
    ),
    // Spellcasting foci
    gear("crystal", { name: "Crystal", group: "Arcane focus", cost: gp(10), weight: 1 }, ARCANE_FOCUS),
    gear("orb", { name: "Orb", group: "Arcane focus", cost: gp(20), weight: 3 }, ARCANE_FOCUS),
    gear("rod", { name: "Rod", group: "Arcane focus", cost: gp(10), weight: 2 }, ARCANE_FOCUS),
    gear("arcane-staff", { name: "Staff", group: "Arcane focus", cost: gp(5), weight: 4 }, ARCANE_FOCUS),
    gear("wand", { name: "Wand", group: "Arcane focus", cost: gp(10), weight: 1 }, ARCANE_FOCUS),
    gear("sprig-of-mistletoe", { name: "Sprig of mistletoe", group: "Druidic focus", cost: gp(1) }, DRUIDIC_FOCUS),
    gear("totem", { name: "Totem", group: "Druidic focus", cost: gp(1) }, DRUIDIC_FOCUS),
    gear("wooden-staff", { name: "Wooden staff", group: "Druidic focus", cost: gp(5), weight: 4 }, DRUIDIC_FOCUS),
    gear("yew-wand", { name: "Yew wand", group: "Druidic focus", cost: gp(10), weight: 1 }, DRUIDIC_FOCUS),
    gear("amulet", { name: "Amulet", group: "Holy symbol", cost: gp(5), weight: 1 }, HOLY_SYMBOL),
    gear("emblem", { name: "Emblem", group: "Holy symbol", cost: gp(5) }, HOLY_SYMBOL),
    gear("reliquary", { name: "Reliquary", group: "Holy symbol", cost: gp(5), weight: 2 }, HOLY_SYMBOL),
    // General
    gear("abacus", { name: "Abacus", cost: gp(2), weight: 2 }),
    gear(
        "acid",
        { name: "Acid (vial)", cost: gp(25), weight: 1 },
        "As an action, you can splash the contents of this vial onto a creature within 5 feet of you or throw the vial up to 20 feet, shattering it on impact. In either case, make a ranged attack against a creature or object, treating the acid as an improvised weapon. On a hit, the target takes 2d6 acid damage.",
    ),
    gear(
        "alchemists-fire",
        { name: "Alchemist's fire (flask)", cost: gp(50), weight: 1 },
        "This sticky, adhesive fluid ignites when exposed to air. As an action, you can throw this flask up to 20 feet, shattering it on impact. Make a ranged attack against a creature or object, treating the alchemist's fire as an improvised weapon. On a hit, the target takes 1d4 fire damage at the start of each of its turns. A creature can end this damage by using its action to make a DC 10 Dexterity check to extinguish the flames.",
    ),
    gear(
        "antitoxin",
        { name: "Antitoxin (vial)", cost: gp(50) },
        "A creature that drinks this vial of liquid gains advantage on saving throws against poison for 1 hour. It confers no benefit to undead or constructs.",
    ),
    gear("backpack", { name: "Backpack", cost: gp(2), weight: 5 }, "Holds 1 cubic foot or 30 pounds of gear."),
    gear(
        "ball-bearings",
        { name: "Ball bearings (bag of 1,000)", cost: gp(1), weight: 2 },
        "As an action, you can spill these tiny metal balls from their pouch to cover a level, square area that is 10 feet on a side. A creature moving across the covered area must succeed on a DC 10 Dexterity saving throw or fall prone. A creature moving through the area at half speed doesn't need to make the save.",
    ),
    gear(
        "barrel",
        { name: "Barrel", cost: gp(2), weight: 70 },
        "Holds 40 gallons of liquid or 4 cubic feet of solids.",
    ),
    gear("basket", { name: "Basket", cost: sp(4), weight: 2 }, "Holds 2 cubic feet or 40 pounds of gear."),
    gear("bedroll", { name: "Bedroll", cost: gp(1), weight: 7 }),
    gear("bell", { name: "Bell", cost: gp(1) }),
    gear("blanket", { name: "Blanket", cost: sp(5), weight: 3 }),
    gear(
        "block-and-tackle",
        { name: "Block and tackle", cost: gp(1), weight: 5 },
        "A set of pulleys with a cable threaded through them and a hook to attach to objects, a block and tackle allows you to hoist up to four times the weight you can normally lift.",
    ),
    gear("book", { name: "Book", cost: gp(25), weight: 5 }),
    gear("glass-bottle", { name: "Bottle, glass", cost: gp(2), weight: 2 }, "Holds 1½ pints of liquid."),
    gear("bucket", { name: "Bucket", cost: cp(5), weight: 2 }, "Holds 3 gallons of liquid or ½ cubic foot of solids."),
    gear(
        "caltrops",
        { name: "Caltrops (bag of 20)", cost: gp(1), weight: 2 },
        "As an action, you can spread a bag of caltrops to cover a square area that is 5 feet on a side. Any creature that enters the area must succeed on a DC 15 Dexterity saving throw or stop moving this turn and take 1 piercing damage. Taking this damage reduces the creature's walking speed by 10 feet until the creature regains at least 1 hit point. A creature moving through the area at half speed doesn't need to make the save.",
    ),
    gear(
        "candle",
        { name: "Candle", cost: cp(1) },
        "For 1 hour, a candle sheds bright light in a 5-foot radius and dim light for an additional 5 feet.",
    ),
    gear(
        "crossbow-bolt-case",
        { name: "Case, crossbow bolt", cost: gp(1), weight: 1 },
        "Holds up to twenty crossbow bolts.",
    ),
    gear(
        "map-or-scroll-case",
        { name: "Case, map or scroll", cost: gp(1), weight: 1 },
        "Holds up to ten rolled-up sheets of paper or five rolled-up sheets of parchment.",
    ),
    gear(
        "chain",
        { name: "Chain (10 feet)", cost: gp(5), weight: 10 },
        "A chain has 10 hit points. It can be burst with a successful DC 20 Strength check.",
    ),
    gear("chalk", { name: "Chalk (1 piece)", cost: cp(1) }),
    gear("chest", { name: "Chest", cost: gp(5), weight: 25 }, "Holds 12 cubic feet or 300 pounds of gear."),
    gear(
        "climbers-kit",
        { name: "Climber's kit", cost: gp(25), weight: 12 },
        "A climber's kit includes special pitons, boot tips, gloves, and a harness. You can use the climber's kit as an action to anchor yourself; when you do, you can't fall more than 25 feet from the point where you anchored yourself, and you can't climb more than 25 feet away from that point without undoing the anchor.",
    ),
    gear("common-clothes", { name: "Clothes, common", cost: sp(5), weight: 3 }),
    gear("costume", { name: "Clothes, costume", cost: gp(5), weight: 4 }),
    gear("fine-clothes", { name: "Clothes, fine", cost: gp(15), weight: 6 }),
    gear("travelers-clothes", { name: "Clothes, traveler's", cost: gp(2), weight: 4 }),
    gear(
        "component-pouch",
        { name: "Component pouch", cost: gp(25), weight: 2 },
        "A component pouch is a small, watertight leather belt pouch that has compartments to hold all the material components and other special items you need to cast your spells, except for those components that have a specific cost.",
    ),
    gear(
        "crowbar",
        { name: "Crowbar", cost: gp(2), weight: 5 },
        "Using a crowbar grants advantage to Strength checks where the crowbar's leverage can be applied.",
    ),
    gear("fishing-tackle", { name: "Fishing tackle", cost: gp(1), weight: 4 }),
    gear("flask-or-tankard", { name: "Flask or tankard", cost: cp(2), weight: 1 }, "Holds 1 pint of liquid."),
    gear("grappling-hook", { name: "Grappling hook", cost: gp(2), weight: 4 }),
    gear("hammer", { name: "Hammer", cost: gp(1), weight: 3 }),
    gear("sledgehammer", { name: "Hammer, sledge", cost: gp(2), weight: 10 }),
    gear(
        "healers-kit",
        { name: "Healer's kit", cost: gp(5), weight: 3 },
        "This kit is a leather pouch containing bandages, salves, and splints. The kit has ten uses. As an action, you can expend one use of the kit to stabilize a creature that has 0 hit points, without needing to make a Wisdom (Medicine) check.",
    ),
    gear(
        "holy-water",
        { name: "Holy water (flask)", cost: gp(25), weight: 1 },
        "As an action, you can splash the contents of this flask onto a creature within 5 feet of you or throw it up to 20 feet, shattering it on impact. In either case, make a ranged attack against a target creature, treating the holy water as an improvised weapon. If the target is a fiend or undead, it takes 2d6 radiant damage.",
    ),
    gear("hourglass", { name: "Hourglass", cost: gp(25), weight: 1 }),
    gear(
        "hunting-trap",
        { name: "Hunting trap", cost: gp(5), weight: 25 },
        "When you use your action to set it, this trap forms a saw-toothed steel ring that snaps shut when a creature steps on a pressure plate in the center. The trap is affixed by a heavy chain to an immobile object. A creature that steps on the plate must succeed on a DC 13 Dexterity saving throw or take 1d4 piercing damage and stop moving. Thereafter, until the creature breaks free of the trap, its movement is limited by the length of the chain (typically 3 feet long). A creature can use its action to make a DC 13 Strength check, freeing itself or another creature within its reach on a success.",
    ),
    gear("ink", { name: "Ink (1 ounce bottle)", cost: gp(10) }),
    gear("ink-pen", { name: "Ink pen", cost: cp(2) }),
    gear("jug-or-pitcher", { name: "Jug or pitcher", cost: cp(2), weight: 4 }, "Holds 1 gallon of liquid."),
    gear("ladder", { name: "Ladder (10-foot)", cost: sp(1), weight: 25 }),
    gear(
        "lamp",
        { name: "Lamp", cost: sp(5), weight: 1 },
        "A lamp casts bright light in a 15-foot radius and dim light for an additional 30 feet. Once lit, it burns for 6 hours on a flask (1 pint) of oil.",
    ),
    gear(
        "bullseye-lantern",
        { name: "Lantern, bullseye", cost: gp(10), weight: 2 },
        "A bullseye lantern casts bright light in a 60-foot cone and dim light for an additional 60 feet. Once lit, it burns for 6 hours on a flask (1 pint) of oil.",
    ),
    gear(
        "hooded-lantern",
        { name: "Lantern, hooded", cost: gp(5), weight: 2 },
        "A hooded lantern casts bright light in a 30-foot radius and dim light for an additional 30 feet. Once lit, it burns for 6 hours on a flask (1 pint) of oil. As an action, you can lower the hood, reducing the light to dim light in a 5-foot radius.",
    ),
    gear(
        "lock",
        { name: "Lock", cost: gp(10), weight: 1 },
        "A key is provided with the lock. Without the key, a creature proficient with thieves' tools can pick this lock with a successful DC 15 Dexterity check.",
    ),
    gear(
        "magnifying-glass",
        { name: "Magnifying glass", cost: gp(100) },
        "This lens allows a closer look at small objects. It is also useful as a substitute for flint and steel when starting fires. Lighting a fire with a magnifying glass requires light as bright as sunlight to focus, tinder to ignite, and about 5 minutes for the fire to ignite. A magnifying glass grants advantage on any ability check made to appraise or inspect an item that is small or highly detailed.",
    ),
    gear(
        "manacles",
        { name: "Manacles", cost: gp(2), weight: 6 },
        "These metal restraints can bind a Small or Medium creature. Escaping the manacles requires a successful DC 20 Dexterity check. Breaking them requires a successful DC 20 Strength check. Each set of manacles comes with one key. Without the key, a creature proficient with thieves' tools can pick the manacles' lock with a successful DC 15 Dexterity check. Manacles have 15 hit points.",
    ),
    gear(
        "mess-kit",
        { name: "Mess kit", cost: sp(2), weight: 1 },
        "This tin box contains a cup and simple cutlery. The box clamps together, and one side can be used as a cooking pan and the other as a plate or shallow bowl.",
    ),
    gear("steel-mirror", { name: "Mirror, steel", cost: gp(5), weight: 0.5 }),
    gear(
        "oil",
        { name: "Oil (flask)", cost: sp(1), weight: 1 },
        "As an action, you can splash the oil in this flask onto a creature within 5 feet of you or throw it up to 20 feet, shattering it on impact. Make a ranged attack against a target creature or object, treating the oil as an improvised weapon. On a hit, the target is covered in oil. If the target takes any fire damage before the oil dries (after 1 minute), the target takes an additional 5 fire damage from the burning oil. You can also pour a flask of oil on the ground to cover a 5-foot-square area, provided that the surface is level. If lit, the oil burns for 2 rounds and deals 5 fire damage to any creature that enters the area or ends its turn in the area. A creature can take this damage only once per turn.",
    ),
    gear("paper", { name: "Paper (one sheet)", cost: sp(2) }),
    gear("parchment", { name: "Parchment (one sheet)", cost: sp(1) }),
    gear("perfume", { name: "Perfume (vial)", cost: gp(5) }),
    gear("miners-pick", { name: "Pick, miner's", cost: gp(2), weight: 10 }),
    gear("piton", { name: "Piton", cost: cp(5), weight: 0.25 }),
    gear(
        "basic-poison",
        { name: "Poison, basic (vial)", cost: gp(100) },
        "You can use the poison in this vial to coat one slashing or piercing weapon or up to three pieces of ammunition. Applying the poison takes an action. A creature hit by the poisoned weapon or ammunition must make a DC 10 Constitution saving throw or take 1d4 poison damage. Once applied, the poison retains potency for 1 minute before drying.",
    ),
    gear("pole", { name: "Pole (10-foot)", cost: cp(5), weight: 7 }),
    gear("iron-pot", { name: "Pot, iron", cost: gp(2), weight: 10 }, "Holds 1 gallon of liquid."),
    gear(
        "potion-of-healing",
        { name: "Potion of healing", cost: gp(50), weight: 0.5 },
        "A character who drinks the magical red fluid in this vial regains 2d4 + 2 hit points. Drinking or administering a potion takes an action.",
    ),
    gear("pouch", { name: "Pouch", cost: sp(5), weight: 1 }, "Holds ⅕ cubic foot or 6 pounds of gear."),
    gear("quiver", { name: "Quiver", cost: gp(1), weight: 1 }, "Holds up to twenty arrows."),
    gear(
        "portable-ram",
        { name: "Ram, portable", cost: gp(4), weight: 35 },
        "You can use a portable ram to break down doors. When doing so, you gain a +4 bonus on the Strength check. One other character can help you use the ram, giving you advantage on this check.",
    ),
    gear(
        "rations",
        { name: "Rations (1 day)", cost: sp(5), weight: 2 },
        "Rations consist of dry foods suitable for extended travel, including jerky, dried fruit, hardtack, and nuts.",
    ),
    gear("robes", { name: "Robes", cost: gp(1), weight: 4 }),
    gear(
        "hempen-rope",
        { name: "Rope, hempen (50 feet)", cost: gp(1), weight: 10 },
        "Rope has 2 hit points and can be burst with a DC 17 Strength check.",
    ),
    gear(
        "silk-rope",
        { name: "Rope, silk (50 feet)", cost: gp(10), weight: 5 },
        "Rope has 2 hit points and can be burst with a DC 17 Strength check.",
    ),
    gear("sack", { name: "Sack", cost: cp(1), weight: 0.5 }, "Holds 1 cubic foot or 30 pounds of gear."),
    gear(
        "merchants-scale",
        { name: "Scale, merchant's", cost: gp(5), weight: 3 },
        "A scale includes a small balance, pans, and a suitable assortment of weights up to 2 pounds. With it, you can measure the exact weight of small objects, such as raw precious metals or trade goods, to help determine their worth.",
    ),
    gear("sealing-wax", { name: "Sealing wax", cost: sp(5) }),
    gear("shovel", { name: "Shovel", cost: gp(2), weight: 5 }),
    gear("signal-whistle", { name: "Signal whistle", cost: cp(5) }),
    gear("signet-ring", { name: "Signet ring", cost: gp(5) }),
    gear("soap", { name: "Soap", cost: cp(2) }),
    gear(
        "spellbook",
        { name: "Spellbook", cost: gp(50), weight: 3 },
        "Essential for wizards, a spellbook is a leather-bound tome with 100 blank vellum pages suitable for recording spells.",
    ),
    gear("iron-spikes", { name: "Spikes, iron (10)", cost: gp(1), weight: 5 }),
    gear(
        "spyglass",
        { name: "Spyglass", cost: gp(1000), weight: 1 },
        "Objects viewed through a spyglass are magnified to twice their size.",
    ),
    gear(
        "two-person-tent",
        { name: "Tent, two-person", cost: gp(2), weight: 20 },
        "A simple and portable canvas shelter, a tent sleeps two.",
    ),
    gear(
        "tinderbox",
        { name: "Tinderbox", cost: sp(5), weight: 1 },
        "This small container holds flint, fire steel, and tinder (usually dry cloth soaked in light oil) used to kindle a fire. Using it to light a torch—or anything else with abundant, exposed fuel—takes an action. Lighting any other fire takes 1 minute.",
    ),
    gear(
        "torch",
        { name: "Torch", cost: cp(1), weight: 1 },
        "A torch burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet. If you make a melee attack with a burning torch and hit, it deals 1 fire damage.",
    ),
    gear("vial", { name: "Vial", cost: gp(1) }, "Holds 4 ounces of liquid."),
    gear(
        "waterskin",
        { name: "Waterskin", cost: sp(2), weight: 5 },
        "Holds 4 pints of liquid. The weight is when full.",
    ),
    gear("whetstone", { name: "Whetstone", cost: cp(1), weight: 1 }),
];
