import type { CompendiumEntry, CompendiumRegisterOptions } from "@planarally/mod-api";

import type { CompendiumId } from "../../types/compendium.ts";
import type { Item, Weapon } from "../../types/item.ts";

import { armors } from "./armor.ts";
import { gearItems } from "./gear.ts";
import { gp, pack } from "./helpers.ts";
import { tools } from "./tools.ts";
import { weapons } from "./weapons.ts";

export { weaponProperties } from "./properties.ts";
export { artisanTools, gamingSets, instruments } from "./tools.ts";

function weaponIds(category: Weapon["category"], range?: Weapon["range"]): CompendiumId<"item">[] {
    return weapons.flatMap((entry) => {
        const data = entry.schema?.data;
        if (data?.type !== "weapon" || data.category !== category) return [];
        return range === undefined || data.range === range ? [entry.id] : [];
    });
}

function groupIds(group: string): CompendiumId<"item">[] {
    return gearItems.flatMap((entry) => {
        const data = entry.schema?.data;
        return data?.type === "gear" && data.group === group ? [entry.id] : [];
    });
}

export const arcaneFoci = groupIds("Arcane focus");
export const druidicFoci = groupIds("Druidic focus");
export const holySymbols = groupIds("Holy symbol");

export const simpleWeapons = weaponIds("simple");
export const simpleMeleeWeapons = weaponIds("simple", "melee");
export const martialWeapons = weaponIds("martial");
export const martialMeleeWeapons = weaponIds("martial", "melee");

const names = new Map([...weapons, ...armors, ...gearItems, ...tools].map((entry) => [entry.id, entry.name]));

const packs: CompendiumEntry<Item>[] = [
    pack(
        "burglars-pack",
        {
            name: "Burglar's pack",
            cost: gp(16),
            contents: [
                { item: "backpack" },
                { item: "ball-bearings" },
                { custom: "String (10 feet)" },
                { item: "bell" },
                { item: "candle", quantity: 5 },
                { item: "crowbar" },
                { item: "hammer" },
                { item: "piton", quantity: 10 },
                { item: "hooded-lantern" },
                { item: "oil", quantity: 2 },
                { item: "rations", quantity: 5 },
                { item: "tinderbox" },
                { item: "waterskin" },
                { item: "hempen-rope" },
            ],
        },
        names,
    ),
    pack(
        "diplomats-pack",
        {
            name: "Diplomat's pack",
            cost: gp(39),
            contents: [
                { item: "chest" },
                { item: "map-or-scroll-case", quantity: 2 },
                { item: "fine-clothes" },
                { item: "ink" },
                { item: "ink-pen" },
                { item: "lamp" },
                { item: "oil", quantity: 2 },
                { item: "paper", quantity: 5 },
                { item: "perfume" },
                { item: "sealing-wax" },
                { item: "soap" },
            ],
        },
        names,
    ),
    pack(
        "dungeoneers-pack",
        {
            name: "Dungeoneer's pack",
            cost: gp(12),
            contents: [
                { item: "backpack" },
                { item: "crowbar" },
                { item: "hammer" },
                { item: "piton", quantity: 10 },
                { item: "torch", quantity: 10 },
                { item: "tinderbox" },
                { item: "rations", quantity: 10 },
                { item: "waterskin" },
                { item: "hempen-rope" },
            ],
        },
        names,
    ),
    pack(
        "entertainers-pack",
        {
            name: "Entertainer's pack",
            cost: gp(40),
            contents: [
                { item: "backpack" },
                { item: "bedroll" },
                { item: "costume", quantity: 2 },
                { item: "candle", quantity: 5 },
                { item: "rations", quantity: 5 },
                { item: "waterskin" },
                { item: "disguise-kit" },
            ],
        },
        names,
    ),
    pack(
        "explorers-pack",
        {
            name: "Explorer's pack",
            cost: gp(10),
            contents: [
                { item: "backpack" },
                { item: "bedroll" },
                { item: "mess-kit" },
                { item: "tinderbox" },
                { item: "torch", quantity: 10 },
                { item: "rations", quantity: 10 },
                { item: "waterskin" },
                { item: "hempen-rope" },
            ],
        },
        names,
    ),
    pack(
        "priests-pack",
        {
            name: "Priest's pack",
            cost: gp(19),
            contents: [
                { item: "backpack" },
                { item: "blanket" },
                { item: "candle", quantity: 10 },
                { item: "tinderbox" },
                { custom: "Alms box" },
                { custom: "Block of incense", quantity: 2 },
                { custom: "Censer" },
                { custom: "Vestments" },
                { item: "rations", quantity: 2 },
                { item: "waterskin" },
            ],
        },
        names,
    ),
    pack(
        "scholars-pack",
        {
            name: "Scholar's pack",
            cost: gp(40),
            contents: [
                { item: "backpack" },
                { item: "book" },
                { item: "ink" },
                { item: "ink-pen" },
                { item: "parchment", quantity: 10 },
                { custom: "Little bag of sand" },
                { custom: "Small knife" },
            ],
        },
        names,
    ),
];

export const items: CompendiumEntry<Item>[] = [...weapons, ...armors, ...gearItems, ...tools, ...packs];

export const itemCollection: CompendiumRegisterOptions = {
    name: "Equipment",
    views: [
        {
            at: ["Weapons"],
            name: "Category",
            by: "category",
            order: ["Simple melee", "Simple ranged", "Martial melee", "Martial ranged"],
        },
        {
            at: ["Armor"],
            name: "Category",
            by: "category",
            order: ["Light armor", "Medium armor", "Heavy armor", "Shield"],
        },
        { at: ["Adventuring gear"], name: "Type", by: "group" },
        { at: ["Tools"], name: "Type", by: "group" },
    ],
};
