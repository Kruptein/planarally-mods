import type { CompendiumEntry } from "@planarally/mod-api";

import type { CompendiumId } from "../../types/compendium.ts";
import type { Spell } from "../../types/spell.ts";

const LEVELS = ["Cantrip", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];

function levelLine(data: Spell): string {
    const level =
        data.level === 0 ? `${data.school} cantrip` : `${LEVELS[data.level]}-level ${data.school.toLowerCase()}`;
    return `*${level}${data.ritual ? " (ritual)" : ""}*`;
}

function componentsText({ verbal, somatic, material }: Spell["components"]): string {
    return [verbal ? "V" : "", somatic ? "S" : "", material === null ? "" : `M (${material})`]
        .filter((part) => part.length > 0)
        .join(", ");
}

// The body starts with the level line and the casting stats, followed by the description
export function spell(
    id: CompendiumId<"spell">,
    name: string,
    data: Spell,
    description: string,
): CompendiumEntry<Spell> {
    const castingTime =
        data.trigger === undefined ? data.castingTime : `${data.castingTime}, which you take ${data.trigger}`;
    const stats = [
        `**Casting Time:** ${castingTime}`,
        `**Range:** ${data.range}`,
        `**Components:** ${componentsText(data.components)}`,
        `**Duration:** ${data.duration}`,
    ];
    return {
        id,
        name,
        body: [levelLine(data), stats.join("\n"), description].join("\n\n"),
        group: { level: LEVELS[data.level] ?? `${data.level}th`, school: data.school },
        schema: { system: "dnd-5e", kind: "spell", data },
    };
}
