import type { CompendiumEntry } from "@planarally/mod-api";

import type { CompendiumId } from "../../types/compendium.ts";
import type { Cost, Item } from "../../types/item.ts";

import { gear, gp, sp } from "./helpers.ts";

const ARTISAN =
    "These special tools include the items needed to pursue a craft or trade. Proficiency with a set of artisan's tools lets you add your proficiency bonus to any ability checks you make using the tools in your craft. Each type of artisan's tools requires a separate proficiency.";

const INSTRUMENT =
    "If you have proficiency with a given musical instrument, you can add your proficiency bonus to any ability checks you make to play music with the instrument. A bard can use a musical instrument as a spellcasting focus. Each type of musical instrument requires a separate proficiency.";

const GAMING_SET =
    "If you are proficient with a gaming set, you can add your proficiency bonus to ability checks you make to play a game with that set. Each type of gaming set requires a separate proficiency.";

function tool(
    id: CompendiumId<"item">,
    name: string,
    group: string,
    cost: Cost,
    weight: number | undefined,
    description: string,
) {
    return gear(id, { name, type: "tool", group, cost, ...(weight === undefined ? {} : { weight }) }, description);
}

const artisan: [CompendiumId<"item">, string, Cost, number][] = [
    ["alchemists-supplies", "Alchemist's supplies", gp(50), 8],
    ["brewers-supplies", "Brewer's supplies", gp(20), 9],
    ["calligraphers-supplies", "Calligrapher's supplies", gp(10), 5],
    ["carpenters-tools", "Carpenter's tools", gp(8), 6],
    ["cartographers-tools", "Cartographer's tools", gp(15), 6],
    ["cobblers-tools", "Cobbler's tools", gp(5), 5],
    ["cooks-utensils", "Cook's utensils", gp(1), 8],
    ["glassblowers-tools", "Glassblower's tools", gp(30), 5],
    ["jewelers-tools", "Jeweler's tools", gp(25), 2],
    ["leatherworkers-tools", "Leatherworker's tools", gp(5), 5],
    ["masons-tools", "Mason's tools", gp(10), 8],
    ["painters-supplies", "Painter's supplies", gp(10), 5],
    ["potters-tools", "Potter's tools", gp(10), 3],
    ["smiths-tools", "Smith's tools", gp(20), 8],
    ["tinkers-tools", "Tinker's tools", gp(50), 10],
    ["weavers-tools", "Weaver's tools", gp(1), 5],
    ["woodcarvers-tools", "Woodcarver's tools", gp(1), 5],
];

const musical: [CompendiumId<"item">, string, Cost, number][] = [
    ["bagpipes", "Bagpipes", gp(30), 6],
    ["drum", "Drum", gp(6), 3],
    ["dulcimer", "Dulcimer", gp(25), 10],
    ["flute", "Flute", gp(2), 1],
    ["lute", "Lute", gp(35), 2],
    ["lyre", "Lyre", gp(30), 2],
    ["horn", "Horn", gp(3), 2],
    ["pan-flute", "Pan flute", gp(12), 2],
    ["shawm", "Shawm", gp(2), 1],
    ["viol", "Viol", gp(30), 1],
];

const games: [CompendiumId<"item">, string, Cost][] = [
    ["dice-set", "Dice set", sp(1)],
    ["playing-card-set", "Playing card set", sp(5)],
];

export const artisanTools = artisan.map(([id]) => id);
export const instruments = musical.map(([id]) => id);
export const gamingSets = games.map(([id]) => id);

export const tools: CompendiumEntry<Item>[] = [
    ...artisan.map(([id, name, cost, weight]) => tool(id, name, "Artisan's tools", cost, weight, ARTISAN)),
    tool(
        "disguise-kit",
        "Disguise kit",
        "Kit",
        gp(25),
        3,
        "This pouch of cosmetics, hair dye, and small props lets you create disguises that change your physical appearance. Proficiency with this kit lets you add your proficiency bonus to any ability checks you make to create a visual disguise.",
    ),
    tool(
        "forgery-kit",
        "Forgery kit",
        "Kit",
        gp(15),
        5,
        "This small box contains a variety of papers and parchments, pens and inks, seals and sealing wax, gold and silver leaf, and other supplies necessary to create convincing forgeries of physical documents. Proficiency with this kit lets you add your proficiency bonus to any ability checks you make to create a physical forgery of a document.",
    ),
    ...games.map(([id, name, cost]) => tool(id, name, "Gaming set", cost, undefined, GAMING_SET)),
    tool(
        "herbalism-kit",
        "Herbalism kit",
        "Kit",
        gp(5),
        3,
        "This kit contains a variety of instruments such as clippers, mortar and pestle, and pouches and vials used by herbalists to create remedies and potions. Proficiency with this kit lets you add your proficiency bonus to any ability checks you make to identify or apply herbs. Also, proficiency with this kit is required to create antitoxin and potions of healing.",
    ),
    ...musical.map(([id, name, cost, weight]) => tool(id, name, "Musical instrument", cost, weight, INSTRUMENT)),
    tool(
        "navigators-tools",
        "Navigator's tools",
        "Kit",
        gp(25),
        2,
        "This set of instruments is used for navigation at sea. Proficiency with navigator's tools lets you chart a ship's course and follow navigation charts. In addition, these tools allow you to add your proficiency bonus to any ability check you make to avoid getting lost at sea.",
    ),
    tool(
        "poisoners-kit",
        "Poisoner's kit",
        "Kit",
        gp(50),
        2,
        "A poisoner's kit includes the vials, chemicals, and other equipment necessary for the creation of poisons. Proficiency with this kit lets you add your proficiency bonus to any ability checks you make to craft or use poisons.",
    ),
    tool(
        "thieves-tools",
        "Thieves' tools",
        "Kit",
        gp(25),
        1,
        "This set of tools includes a small file, a set of lock picks, a small mirror mounted on a metal handle, a set of narrow-bladed scissors, and a pair of pliers. Proficiency with these tools lets you add your proficiency bonus to any ability checks you make to disarm traps or open locks.",
    ),
];
