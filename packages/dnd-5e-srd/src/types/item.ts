import type { CompendiumId } from "./compendium.ts";

export type CoinUnit = "cp" | "sp" | "ep" | "gp" | "pp";

export type Coins = Record<CoinUnit, number>;

export interface Cost {
    amount: number;
    unit: CoinUnit;
}

export type WeaponProperty =
    | "ammunition"
    | "finesse"
    | "heavy"
    | "light"
    | "loading"
    | "reach"
    | "special"
    | "thrown"
    | "two-handed"
    | "versatile";

// Compendium kind "weapon-property", with id `weapon-property-<property>`. "range" explains the distances of the
// ammunition and thrown properties.
export interface WeaponPropertyRule {
    property: WeaponProperty | "range";
}

interface ItemBase {
    // Default English name
    name: string;
    // Source book
    source: string;
    // Of a bundle when `bundle` is set, e.g. 1 gp for 20 arrows
    cost?: Cost;
    // In pounds, of a bundle when `bundle` is set
    weight?: number;
    // Sold in bundles of this many, while the inventory counts single pieces
    bundle?: number;
}

export interface Weapon extends ItemBase {
    type: "weapon";
    category: "simple" | "martial";
    range: "melee" | "ranged";
    // Dice expression, e.g. "1d8". Undefined for a weapon that deals no damage, e.g. a net.
    damage?: string;
    damageType?: string;
    // Two-handed damage of a versatile weapon
    versatile?: string;
    properties: WeaponProperty[];
    // In feet, for ammunition and thrown weapons
    distance?: { normal: number; long: number };
    // The ammunition it fires
    ammunition?: CompendiumId<"item">;
}

export interface Armor extends ItemBase {
    type: "armor";
    category: "light" | "medium" | "heavy" | "shield";
    // The base AC, or the bonus of a shield
    armorClass: number;
    // The most Dexterity adds, undefined for no limit. 0 for heavy armor.
    dexterityCap?: number;
    // Strength score below which the speed drops by 10 feet
    strength?: number;
    stealthDisadvantage?: boolean;
}

export interface Gear extends ItemBase {
    type: "gear" | "tool" | "ammunition";
    // A shared kind, e.g. "Arcane focus", "Musical instrument" or "Artisan's tools"
    group?: string;
}

// Unpacked into its contents when added to an inventory
export interface Pack extends ItemBase {
    type: "pack";
    contents: EquipmentGrant[];
}

export type Item = Weapon | Armor | Gear | Pack;

export type ItemType = Item["type"];

// Part of a starting equipment option or a pack
export type EquipmentGrant =
    | { item: CompendiumId<"item">; quantity?: number }
    // One of these items, picked by the player
    | { from: CompendiumId<"item">[]; quantity?: number }
    // Something outside the compendium, e.g. "a prayer book"
    | { custom: string; quantity?: number }
    | { coins: number; unit: CoinUnit };

// One line of starting equipment, e.g. "(a) a greataxe or (b) any martial melee weapon"
export interface StartingEquipment {
    // As printed
    text: string;
    // The options to pick one from, a single option for a line without a choice
    options: EquipmentGrant[][];
}
