export interface Ability {
    // Short form used in rules text, e.g. "str". Custom data references for the ability are built from it,
    // so it has to be unique across all abilities in the system and only contain word characters.
    abbreviation: string;
}
