import type { CompendiumEntry } from "@planarally/mod-api";

import type { SrdModTag } from "../../types/character.ts";
import type { CompendiumId } from "../../types/compendium.ts";
import type { WeaponPropertyRule } from "../../types/item.ts";

const MOD: SrdModTag = "srd-5-1";

export function weaponPropertyId(property: WeaponPropertyRule["property"]): CompendiumId<"weapon-property"> {
    return `weapon-property-${property}`;
}

export function weaponPropertyLink(text: string, property: WeaponPropertyRule["property"]): string {
    return `[${text}](compendium:${MOD}/${weaponPropertyId(property)})`;
}

function rule(
    property: WeaponPropertyRule["property"],
    name: string,
    body: string,
): CompendiumEntry<WeaponPropertyRule> {
    return {
        id: weaponPropertyId(property),
        name,
        body,
        path: ["Weapon properties"],
        group: {},
        schema: { system: "dnd-5e", kind: "weapon-property", data: { property } },
    };
}

export const weaponProperties: CompendiumEntry<WeaponPropertyRule>[] = [
    rule(
        "ammunition",
        "Ammunition",
        `You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition. Drawing the ammunition from a quiver, case, or other container is part of the attack (you need a free hand to load a one-handed weapon). At the end of the battle, you can recover half your expended ammunition by taking a minute to search the battlefield.

If you use a weapon that has the ammunition property to make a melee attack, you treat the weapon as an improvised weapon. A sling must be loaded to deal any damage when used in this way.`,
    ),
    rule(
        "finesse",
        "Finesse",
        "When making an attack with a finesse weapon, you use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.",
    ),
    rule(
        "heavy",
        "Heavy",
        "Small creatures have disadvantage on attack rolls with heavy weapons. A heavy weapon's size and bulk make it too large for a Small creature to use effectively.",
    ),
    rule(
        "light",
        "Light",
        "A light weapon is small and easy to handle, making it ideal for use when fighting with two weapons.",
    ),
    rule(
        "loading",
        "Loading",
        "Because of the time required to load this weapon, you can fire only one piece of ammunition from it when you use an action, bonus action, or reaction to fire it, regardless of the number of attacks you can normally make.",
    ),
    rule(
        "range",
        "Range",
        `A weapon that can be used to make a ranged attack has a range in parentheses after the ${weaponPropertyLink("ammunition", "ammunition")} or ${weaponPropertyLink("thrown", "thrown")} property. The range lists two numbers. The first is the weapon's normal range in feet, and the second indicates the weapon's long range. When attacking a target beyond normal range, you have disadvantage on the attack roll. You can't attack a target beyond the weapon's long range.`,
    ),
    rule(
        "reach",
        "Reach",
        "This weapon adds 5 feet to your reach when you attack with it, as well as when determining your reach for opportunity attacks with it.",
    ),
    rule(
        "special",
        "Special",
        "A weapon with the special property has unusual rules governing its use, explained in the weapon's description.",
    ),
    rule(
        "thrown",
        "Thrown",
        `If a weapon has the thrown property, you can throw the weapon to make a ranged attack. If the weapon is a melee weapon, you use the same ability modifier for that attack roll and damage roll that you would use for a melee attack with the weapon. For example, if you throw a handaxe, you use your Strength, but if you throw a dagger, you can use either your Strength or your Dexterity, since the dagger has the ${weaponPropertyLink("finesse", "finesse")} property.`,
    ),
    rule("two-handed", "Two-Handed", "This weapon requires two hands when you attack with it."),
    rule(
        "versatile",
        "Versatile",
        "This weapon can be used with one or two hands. A damage value in parentheses appears with the property—the damage when the weapon is used with two hands to make a melee attack.",
    ),
];
