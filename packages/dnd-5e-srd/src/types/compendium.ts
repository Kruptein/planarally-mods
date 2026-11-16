export type CompendiumKind =
    | "ability"
    | "skill"
    | "language"
    | "background"
    | "condition"
    | "race"
    | "subrace"
    | "class"
    | "subclass"
    | "spell"
    | "item"
    | "weapon-property";

// The id of a compendium entry of the kind, e.g. "strength" for an ability. Ids of another kind or refs don't
// assign to it, while plain strings do so data can use literals and stored text needs no cast.
export type CompendiumId<K extends CompendiumKind> = string & { readonly __compendium?: K };

// An entry across mods as `${mod}/${id}`, e.g. "srd-5-1/strength", for `api.compendium.getEntry` and `openRuleAt`
export type CompendiumRef = string & { readonly __compendium?: "ref" };
