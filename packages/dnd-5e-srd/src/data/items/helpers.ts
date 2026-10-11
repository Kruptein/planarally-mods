import type { CompendiumEntry } from "@planarally/mod-api";

import type { CompendiumId } from "../../types/compendium.ts";
import type { Armor, Cost, EquipmentGrant, Gear, Item, Pack, Weapon, WeaponProperty } from "../../types/item.ts";

import { weaponPropertyLink } from "./properties.ts";

export const SOURCE = "SRD 5.1";

export const cp = (amount: number): Cost => ({ amount, unit: "cp" });
export const sp = (amount: number): Cost => ({ amount, unit: "sp" });
export const gp = (amount: number): Cost => ({ amount, unit: "gp" });

const FRACTIONS: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };

export function weightText(pounds: number): string {
    const whole = Math.floor(pounds);
    const fraction = FRACTIONS[pounds - whole];
    if (fraction === undefined) return `${pounds} lb.`;
    return `${whole === 0 ? "" : whole}${fraction} lb.`;
}

function costText(cost: Cost): string {
    return `${cost.amount.toLocaleString("en")} ${cost.unit}`;
}

function capitalise(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function propertyText(weapon: Omit<Weapon, "type" | "source">, property: WeaponProperty, first: boolean): string {
    const link = weaponPropertyLink(first ? capitalise(property) : property, property);
    const distance =
        weapon.distance === undefined
            ? ""
            : ` (${weaponPropertyLink("range", "range")} ${weapon.distance.normal}/${weapon.distance.long})`;
    if (property === "ammunition" || property === "thrown") return `${link}${distance}`;
    if (property === "versatile") return `${link} (${weapon.versatile})`;
    return link;
}

function stats(lines: [string, string | undefined][]): string {
    return lines.flatMap(([label, value]) => (value === undefined ? [] : [`**${label}:** ${value}`])).join("\n");
}

function sections(...parts: (string | undefined)[]): string {
    return parts.filter((part) => part !== undefined && part.length > 0).join("\n\n");
}

function bundleText(item: Pick<Item, "bundle">): string | undefined {
    return item.bundle === undefined ? undefined : `${item.bundle}`;
}

function entry(
    id: CompendiumId<"item">,
    data: Item,
    body: string,
    path: string[],
    group: Record<string, string>,
): CompendiumEntry<Item> {
    return { id, name: data.name, body, path, group, schema: { system: "dnd-5e", kind: "item", data } };
}

export function weapon(
    id: CompendiumId<"item">,
    data: Omit<Weapon, "type" | "source">,
    description?: string,
): CompendiumEntry<Item> {
    const kind = `${capitalise(data.category)} ${data.range}`;
    const damage = data.damage === undefined ? "—" : `${data.damage} ${data.damageType ?? ""}`.trim();
    const properties = data.properties.map((property, index) => propertyText(data, property, index === 0)).join(", ");
    const body = sections(
        `*${kind} weapon*`,
        stats([
            ["Cost", data.cost && costText(data.cost)],
            ["Damage", damage],
            ["Weight", data.weight === undefined ? "—" : weightText(data.weight)],
            ["Properties", properties.length === 0 ? "—" : properties],
        ]),
        description,
    );
    return entry(id, { ...data, type: "weapon", source: SOURCE }, body, ["Weapons"], { category: kind });
}

const ARMOR_CATEGORY: Record<Armor["category"], string> = {
    light: "Light armor",
    medium: "Medium armor",
    heavy: "Heavy armor",
    shield: "Shield",
};

function armorClassText(data: Omit<Armor, "type" | "source">): string {
    if (data.category === "shield") return `+${data.armorClass}`;
    if (data.dexterityCap === 0) return `${data.armorClass}`;
    if (data.dexterityCap === undefined) return `${data.armorClass} + Dex modifier`;
    return `${data.armorClass} + Dex modifier (max ${data.dexterityCap})`;
}

export function armor(id: CompendiumId<"item">, data: Omit<Armor, "type" | "source">): CompendiumEntry<Item> {
    const category = ARMOR_CATEGORY[data.category];
    const body = sections(
        `*${category}*`,
        stats([
            ["Cost", data.cost && costText(data.cost)],
            ["Armor Class", armorClassText(data)],
            ["Strength", data.strength === undefined ? undefined : `Str ${data.strength}`],
            ["Stealth", data.stealthDisadvantage ? "Disadvantage" : undefined],
            ["Weight", data.weight === undefined ? undefined : weightText(data.weight)],
        ]),
        data.strength === undefined
            ? undefined
            : `If your Strength score is lower than ${data.strength}, your speed is reduced by 10 feet while you wear this armor.`,
    );
    return entry(id, { ...data, type: "armor", source: SOURCE }, body, ["Armor"], { category });
}

const GEAR_PATH: Record<Gear["type"], string> = {
    gear: "Adventuring gear",
    ammunition: "Adventuring gear",
    tool: "Tools",
};

export function gear(
    id: CompendiumId<"item">,
    data: Omit<Gear, "source" | "type"> & { type?: Gear["type"] },
    description?: string,
): CompendiumEntry<Item> {
    const type = data.type ?? "gear";
    const group = data.group ?? (type === "ammunition" ? "Ammunition" : "General");
    const body = sections(
        `*${type === "tool" ? (data.group ?? "Tool") : group}*`,
        stats([
            ["Cost", data.cost && costText(data.cost)],
            ["Weight", data.weight === undefined ? undefined : weightText(data.weight)],
            ["Sold per", bundleText(data)],
        ]),
        description,
    );
    return entry(id, { ...data, type, source: SOURCE }, body, [GEAR_PATH[type]], { group });
}

function grantText(grant: EquipmentGrant, names: ReadonlyMap<string, string>): string {
    if ("coins" in grant) return `${grant.coins} ${grant.unit}`;
    const quantity = grant.quantity !== undefined && grant.quantity > 1 ? `${grant.quantity} × ` : "";
    if ("custom" in grant) return `${quantity}${grant.custom}`;
    if ("item" in grant) return `${quantity}${names.get(grant.item) ?? grant.item}`;
    return `${quantity}${grant.from.map((id) => names.get(id) ?? id).join(" or ")}`;
}

// `names` resolves the item ids of the contents, e.g. from the other item entries
export function pack(
    id: CompendiumId<"item">,
    data: Omit<Pack, "type" | "source">,
    names: ReadonlyMap<string, string>,
): CompendiumEntry<Item> {
    const body = sections(
        "*Equipment pack*",
        stats([
            ["Cost", data.cost && costText(data.cost)],
            ["Weight", data.weight === undefined ? undefined : weightText(data.weight)],
        ]),
        `Includes ${data.contents.map((grant) => grantText(grant, names)).join(", ")}.`,
        "Added to an inventory as its contents.",
    );
    return entry(id, { ...data, type: "pack", source: SOURCE }, body, ["Equipment packs"], {});
}
