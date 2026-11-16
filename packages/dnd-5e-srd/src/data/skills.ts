import type { CompendiumEntry } from "@planarally/mod-api";

import type { Skill } from "../types/skill.ts";

function skill(id: string, name: string, ability: string, body: string): CompendiumEntry<Skill> {
    return { id, name, body, schema: { system: "dnd-5e", kind: "skill", data: { ability } } };
}

export const skills = [
    skill(
        "acrobatics",
        "Acrobatics",
        "dexterity",
        "Staying on your feet in a tricky situation, or performing stunts like dives, rolls and flips.",
    ),
    skill(
        "animal-handling",
        "Animal Handling",
        "wisdom",
        "Calming a domesticated animal, keeping a mount from getting spooked, or intuiting an animal's intentions.",
    ),
    skill(
        "arcana",
        "Arcana",
        "intelligence",
        "Recalling lore about spells, magic items, eldritch symbols, magical traditions and the planes of existence.",
    ),
    skill("athletics", "Athletics", "strength", "Climbing, jumping and swimming in difficult situations."),
    skill("deception", "Deception", "charisma", "Convincingly hiding the truth, verbally or through your actions."),
    skill(
        "history",
        "History",
        "intelligence",
        "Recalling lore about historical events, legendary people, ancient kingdoms and lost civilizations.",
    ),
    skill(
        "insight",
        "Insight",
        "wisdom",
        "Determining the true intentions of a creature, such as when searching out a lie or predicting someone's next move.",
    ),
    skill(
        "intimidation",
        "Intimidation",
        "charisma",
        "Influencing someone through overt threats, hostile actions and physical violence.",
    ),
    skill(
        "investigation",
        "Investigation",
        "intelligence",
        "Looking around for clues and making deductions based on those clues.",
    ),
    skill("medicine", "Medicine", "wisdom", "Stabilizing a dying companion or diagnosing an illness."),
    skill(
        "nature",
        "Nature",
        "intelligence",
        "Recalling lore about terrain, plants and animals, the weather and natural cycles.",
    ),
    skill("perception", "Perception", "wisdom", "Spotting, hearing or otherwise detecting the presence of something."),
    skill(
        "performance",
        "Performance",
        "charisma",
        "Delighting an audience with music, dance, acting, storytelling or some other form of entertainment.",
    ),
    skill(
        "persuasion",
        "Persuasion",
        "charisma",
        "Influencing someone or a group of people with tact, social graces or good nature.",
    ),
    skill(
        "religion",
        "Religion",
        "intelligence",
        "Recalling lore about deities, rites and prayers, religious hierarchies, holy symbols and secret cults.",
    ),
    skill(
        "sleight-of-hand",
        "Sleight of Hand",
        "dexterity",
        "Acts of legerdemain or manual trickery, such as planting something on someone else or concealing an object.",
    ),
    skill(
        "stealth",
        "Stealth",
        "dexterity",
        "Concealing yourself from enemies, slinking past guards or sneaking up on someone without being seen or heard.",
    ),
    skill(
        "survival",
        "Survival",
        "wisdom",
        "Following tracks, hunting wild game, guiding a group through wastelands and predicting the weather.",
    ),
];
