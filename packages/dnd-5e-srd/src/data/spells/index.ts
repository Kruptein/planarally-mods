import { cantrips } from "./cantrips.ts";
import { level1Spells } from "./level-1.ts";
import { level2Spells } from "./level-2.ts";
import { level3Spells } from "./level-3.ts";
import { level4Spells } from "./level-4.ts";
import { level5Spells } from "./level-5.ts";
import { level6Spells } from "./level-6.ts";
import { level7Spells } from "./level-7.ts";
import { level8Spells } from "./level-8.ts";
import { level9Spells } from "./level-9.ts";

export const spells = [
    ...cantrips,
    ...level1Spells,
    ...level2Spells,
    ...level3Spells,
    ...level4Spells,
    ...level5Spells,
    ...level6Spells,
    ...level7Spells,
    ...level8Spells,
    ...level9Spells,
];
