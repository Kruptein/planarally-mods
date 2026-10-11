import type { CompendiumRecord } from "@planarally/mod-api";

import type {
    EvaluatedEquipmentGrant,
    EvaluatedItem,
    Inventory,
    InventoryItem,
    NewItem,
    StartingEquipmentPick,
} from "../types/character.ts";
import type { CompendiumId } from "../types/compendium.ts";
import type { UnarmoredDefense } from "../types/grants.ts";
import type { CoinUnit, EquipmentGrant, Item, StartingEquipment } from "../types/item.ts";

import type { Named } from "./grants.ts";

export const ARMOR_GROUPS: readonly Named[] = [
    { id: "light-armor", name: "Light armor" },
    { id: "medium-armor", name: "Medium armor" },
    { id: "heavy-armor", name: "Heavy armor" },
    { id: "shields", name: "Shields" },
];

export const WEAPON_GROUPS: readonly Named[] = [
    { id: "simple-weapons", name: "Simple weapons" },
    { id: "martial-weapons", name: "Martial weapons" },
];

export const COIN_UNITS: readonly CoinUnit[] = ["cp", "sp", "ep", "gp", "pp"];

const COINS_PER_POUND = 50;

export type ItemRecord = CompendiumRecord<Item>;

export function itemsOfType(items: readonly ItemRecord[], type: Item["type"]): ItemRecord[] {
    return items.filter((record) => record.schema.data?.type === type);
}

function createItemId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Undefined for items other than weapons, armor and shields
export function isProficient(
    record: Pick<ItemRecord, "id">,
    data: Item,
    weapons: ReadonlySet<string>,
    armor: ReadonlySet<string>,
): boolean | undefined {
    if (data.type === "weapon") return weapons.has(`${data.category}-weapons`) || weapons.has(record.id);
    if (data.type !== "armor") return undefined;
    return armor.has(data.category === "shield" ? "shields" : `${data.category}-armor`) || armor.has(record.id);
}

export function unitWeight(item: InventoryItem, data: Item | undefined): number {
    if (data === undefined) return item.weight ?? 0;
    return (data.weight ?? 0) / (data.bundle ?? 1);
}

export function carriedWeight(items: readonly EvaluatedItem[], inventory: Inventory): number {
    const coins = COIN_UNITS.reduce((sum, unit) => sum + inventory.coins[unit], 0);
    const weight = items.reduce((sum, item) => sum + item.unitWeight * item.quantity, coins / COINS_PER_POUND);
    return Math.round(weight * 100) / 100;
}

// The equipped body armor and shield that count towards the armor class: the first of each
export function wornArmor(items: readonly EvaluatedItem[]): { armor?: EvaluatedItem; shield?: EvaluatedItem } {
    const equipped = items.filter((item) => item.equipped && item.data?.type === "armor");
    return {
        armor: equipped.find((item) => item.data?.type === "armor" && item.data.category !== "shield"),
        shield: equipped.find((item) => item.data?.type === "armor" && item.data.category === "shield"),
    };
}

// Joins the parts with +, leaving out zeros and empty parts
export function sumExpression(parts: readonly (string | number)[]): string {
    return parts.filter((part) => part !== 0 && part !== "").join(" + ");
}

// `dexterity` and `references` are the modifier references of the abilities, e.g. "{dex}"
export function armorClassFormula(
    items: readonly EvaluatedItem[],
    unarmored: readonly UnarmoredDefense[],
    dexterity: string,
    references: (abilityId: CompendiumId<"ability">) => string | undefined,
    bonus: string,
): string {
    const { armor, shield } = wornArmor(items);
    const shieldBonus = shield?.data?.type === "armor" ? shield.data.armorClass + shield.bonus : 0;
    let base: string;
    if (armor?.data?.type === "armor") {
        const cap = armor.data.dexterityCap;
        const dex = cap === 0 ? "" : cap === undefined ? dexterity : `min(${dexterity}, ${cap})`;
        base = sumExpression([armor.data.armorClass + armor.bonus, dex]);
    } else {
        const options = [
            `10 + ${dexterity}`,
            ...unarmored
                .filter((defense) => shield === undefined || defense.shield)
                .map((defense) =>
                    sumExpression([defense.base, dexterity, ...defense.abilities.map((id) => references(id) ?? "")]),
                ),
        ];
        const unique = [...new Set(options)];
        base = unique.length === 1 ? unique[0]! : `max(${unique.join(", ")})`;
    }
    return sumExpression([base, shieldBonus, bonus]);
}

function findRecord(items: readonly ItemRecord[], id: CompendiumId<"item"> | undefined): ItemRecord | undefined {
    return id === undefined ? undefined : items.find((record) => record.id === id);
}

function stackable(item: InventoryItem): boolean {
    return !item.equipped && item.bonus === 0 && item.notes === "";
}

// Adds in place. A pack adds its contents, coins in it go to the purse.
export function addToInventory(inventory: Inventory, items: readonly ItemRecord[], added: NewItem): void {
    const quantity = Math.max(Math.round(added.quantity ?? 1), 1);
    const record = findRecord(items, added.item);
    const data = record?.schema.data;
    if (data?.type === "pack") {
        for (let count = 0; count < quantity; count++) {
            for (const grant of data.contents) addGrant(inventory, items, grant, undefined);
        }
        return;
    }
    if (added.item !== undefined && record === undefined) return;
    const name = record?.name ?? added.name?.trim() ?? "";
    if (name.length === 0) return;
    const stack = inventory.items.find(
        (item) => item.item === record?.id && (record !== undefined || item.name === name) && stackable(item),
    );
    if (stack !== undefined && (record !== undefined || stack.weight === added.weight)) {
        stack.quantity += quantity;
        return;
    }
    inventory.items.push({
        id: createItemId(),
        ...(record === undefined ? {} : { item: record.id }),
        name,
        quantity,
        equipped: false,
        bonus: 0,
        ...(record === undefined && added.weight !== undefined ? { weight: added.weight } : {}),
        notes: "",
    });
}

// `picked` is the item for a `from` grant
function addGrant(
    inventory: Inventory,
    items: readonly ItemRecord[],
    grant: EquipmentGrant,
    picked: CompendiumId<"item"> | undefined,
) {
    if ("coins" in grant) inventory.coins[grant.unit] += grant.coins;
    else if ("custom" in grant) addToInventory(inventory, items, { name: grant.custom, quantity: grant.quantity });
    else if ("item" in grant) addToInventory(inventory, items, { item: grant.item, quantity: grant.quantity });
    else if (picked !== undefined) addToInventory(inventory, items, { item: picked, quantity: grant.quantity });
}

export function evaluateEquipment(
    lines: readonly StartingEquipment[],
    items: readonly ItemRecord[],
): { text: string; options: EvaluatedEquipmentGrant[][] }[] {
    const nameOf = (id: CompendiumId<"item">): string => findRecord(items, id)?.name ?? id;
    return lines.map(({ text, options }) => ({
        text,
        options: options.map((option) =>
            option.map((grant): EvaluatedEquipmentGrant => {
                if ("coins" in grant) return { kind: "coins", amount: grant.coins, unit: grant.unit };
                const quantity = grant.quantity ?? 1;
                if ("custom" in grant) return { kind: "custom", name: grant.custom, quantity };
                if ("item" in grant) return { kind: "item", item: grant.item, name: nameOf(grant.item), quantity };
                return { kind: "from", options: grant.from.map((id) => ({ id, name: nameOf(id) })), quantity };
            }),
        ),
    }));
}

// Adds in place, false without changes when a pick doesn't fit the lines
export function addStartingEquipment(
    inventory: Inventory,
    items: readonly ItemRecord[],
    lines: readonly StartingEquipment[],
    picks: readonly StartingEquipmentPick[],
): boolean {
    if (picks.length !== lines.length) return false;
    const chosen: [EquipmentGrant, CompendiumId<"item"> | undefined][] = [];
    for (const [index, line] of lines.entries()) {
        const pick = picks[index]!;
        const option = line.options[pick.option];
        if (option === undefined) return false;
        let next = 0;
        for (const grant of option) {
            if (!("from" in grant)) {
                chosen.push([grant, undefined]);
                continue;
            }
            const picked = pick.from[next++];
            if (picked === undefined || !grant.from.includes(picked)) return false;
            chosen.push([grant, picked]);
        }
    }
    for (const [grant, picked] of chosen) addGrant(inventory, items, grant, picked);
    return true;
}
