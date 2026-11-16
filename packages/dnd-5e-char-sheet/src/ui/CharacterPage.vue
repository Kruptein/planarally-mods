<script setup lang="ts">
import type { DiceSimplification, PendingDiceSimplification } from "@planarally/mod-api";
import type { EvaluatedTrait } from "@planarally/system-dnd-5e-srd";
import { computed, reactive } from "vue";

import AttacksPanel from "./AttacksPanel.vue";
import ChoicePicker from "./ChoicePicker.vue";
import {
    derivedStats,
    isPending,
    setOpenedAbilityScore,
    setOpenedBackground,
    setOpenedClassLevel,
    setOpenedHitPointBonus,
    setOpenedLanguages,
    setOpenedRace,
    setOpenedStartingClass,
    setOpenedSubclass,
    setOpenedSubrace,
    setOpenedSaveProficiency,
    setOpenedSkillProficiency,
    sourceText,
    type SheetAbility,
    type SheetChoice,
    type SheetClass,
    type SheetSkill,
    type SheetStats,
} from "./data";
import { ROLL_HINT, rollD20 } from "./rolls";
import {
    commitNumber,
    createId,
    derivedInitiative,
    derivedPassivePerception,
    modifierOf,
    signed,
    type Character,
} from "./sheet";
import StatInput from "./StatInput.vue";

const props = defineProps<{ stats: SheetStats | undefined }>();
const model = defineModel<Character>({ required: true });
const character = reactive(model.value);

const derived = computed(() => derivedStats(props.stats));

const initiativeReference = computed(() => props.stats?.initiativeReference);

function simplifiedText(value: DiceSimplification | PendingDiceSimplification): string {
    switch (value.kind) {
        case "number":
            return signed(value.value);
        case "dice":
            return value.expression;
        case "error":
            return "!";
        case "pending":
            return "…";
    }
}

function simplifiedError(value: DiceSimplification | PendingDiceSimplification): string | undefined {
    return value.kind === "error" ? value.message : undefined;
}

// The input shows the total score; the stored base score excludes the increases
function setScore(ability: SheetAbility, event: Event): void {
    const input = event.target as HTMLInputElement;
    const total = commitNumber(input.value, ability.score + ability.increase);
    setOpenedAbilityScore(ability.id, total - ability.increase);
    input.value = String(total);
}

function scoreTitle(ability: SheetAbility): string | undefined {
    if (ability.increases.length === 0) return undefined;
    const parts = ability.increases.map((increase) => `${increase.source.name} ${signed(increase.amount)}`);
    return [`Base ${ability.score}`, ...parts].join(" · ");
}

const classes = computed(() => props.stats?.classes ?? []);
const classSummary = computed(() =>
    classes.value
        .map((entry) => {
            const subclass = entry.subclass.name.length > 0 ? ` (${entry.subclass.name})` : "";
            return `${entry.name}${subclass} ${entry.level}`;
        })
        .join(" / "),
);
const addableClasses = computed(() =>
    (props.stats?.allClasses ?? []).filter((option) => !classes.value.some((entry) => entry.id === option.id)),
);

function setClassLevel(entry: SheetClass, event: Event): void {
    const input = event.target as HTMLInputElement;
    const level = Math.min(Math.max(commitNumber(input.value, entry.level), 1), 20);
    setOpenedClassLevel(entry.id, level);
    input.value = String(level);
}

function addClass(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    select.value = "";
    if (id.length > 0) setOpenedClassLevel(id, 1);
}

function subclassPlaceholder(entry: SheetClass): string {
    if (entry.level < entry.subclassLevel) return `${entry.subclassTitle} at level ${entry.subclassLevel}`;
    return `${entry.subclassTitle}…`;
}

const hitPointBonus = computed({
    get: () => props.stats?.hitPointBonus ?? 0,
    set: (bonus: number) => setOpenedHitPointBonus(bonus),
});

const hitPointParts = computed(() => {
    const parts = classes.value.map((entry, index) => {
        const average = entry.hitDie / 2 + 1;
        if (index > 0) return `${entry.name} ${entry.level}×${average}`;
        return entry.level > 1
            ? `${entry.name} ${entry.hitDie} + ${entry.level - 1}×${average}`
            : `${entry.name} ${entry.hitDie}`;
    });
    const level = props.stats?.level ?? 0;
    if (level > 0) parts.push(`Con ${signed(modifierOf(derived.value, "con"))} × ${level}`);
    return parts;
});

const hitDiceText = computed(
    () => (props.stats?.hitDice ?? []).map((dice) => `${dice.count}d${dice.die}`).join(" + ") || "—",
);
const hitDiceTotal = computed(() => (props.stats?.hitDice ?? []).reduce((sum, dice) => sum + dice.count, 0));
const hitDiceRemaining = computed(() => Math.max(hitDiceTotal.value - character.hitDice.spent, 0));

function setHitDiceRemaining(event: Event): void {
    const input = event.target as HTMLInputElement;
    const remaining = Math.min(Math.max(commitNumber(input.value, hitDiceRemaining.value), 0), hitDiceTotal.value);
    character.hitDice.spent = hitDiceTotal.value - remaining;
    input.value = String(remaining);
}

function setPlain(event: Event, apply: (value: number) => void, fallback: number): void {
    const input = event.target as HTMLInputElement;
    const value = commitNumber(input.value, fallback);
    apply(value);
    input.value = String(value);
}

const traitKey = (trait: EvaluatedTrait): string =>
    `${trait.source.kind}/${trait.source.id}/${trait.level ?? 0}/${trait.name}`;
// Features start collapsed, except new ones that still need their text
const openFeatures = reactive(new Set<string>());

function toggleFeature(id: string): void {
    if (!openFeatures.delete(id)) openFeatures.add(id);
}

function addFeature(): void {
    const id = createId();
    character.features.push({ id, name: "", text: "" });
    openFeatures.add(id);
}

function removeFeature(id: string): void {
    character.features = character.features.filter((feature) => feature.id !== id);
    openFeatures.delete(id);
}

function abilityLabel(abbreviation: string): string {
    return abbreviation.charAt(0).toUpperCase() + abbreviation.slice(1);
}

const background = computed(() => props.stats?.background);
const choices = computed(() => props.stats?.choices ?? []);
const pendingBackgroundChoices = computed(
    () => choices.value.filter((choice) => choice.source.kind === "background" && isPending(choice)).length,
);
function pendingFrom(...kinds: SheetChoice["source"]["kind"][]): number {
    return choices.value.filter((choice) => kinds.includes(choice.source.kind) && isPending(choice)).length;
}
const pendingRaceChoices = computed(() => pendingFrom("race", "subrace"));
const pendingClassChoices = computed(
    () => pendingFrom("class", "subclass") + classes.value.filter((entry) => entry.subclassPending).length,
);
function choicesOf(...kinds: SheetChoice["kind"][]): SheetChoice[] {
    return choices.value.filter((choice) => kinds.includes(choice.kind));
}
const choiceKey = (choice: SheetChoice): string => `${choice.source.kind}/${choice.source.id}/${choice.id}`;

// Only proficient skills that are not already expertise can be picked
const expertiseExcluded = computed(() =>
    (props.stats?.skills ?? [])
        .filter((skill) => skill.proficiency < 1 || skill.proficiency >= 2)
        .map((skill) => skill.id),
);

function pendingText(count: number): string {
    return `${count} ${count === 1 ? "choice" : "choices"} pending`;
}

function setRace(event: Event): void {
    const input = event.target as HTMLInputElement;
    setOpenedRace(input.value);
    input.value = props.stats?.race.name ?? "";
}

const grantGroups = computed(() =>
    [
        { label: "Armor", items: props.stats?.armor ?? [] },
        { label: "Weapons", items: props.stats?.weapons ?? [] },
        { label: "Tools", items: props.stats?.tools ?? [] },
    ].filter((group) => group.items.length > 0),
);

const speedParts = computed(() => {
    const speed = props.stats?.speed;
    return speed === undefined ? ["default 30 ft"] : [`${speed.source.name} ${speed.value} ft`];
});
const knownLanguageIds = computed(() => (props.stats?.languages ?? []).map((language) => language.id));
const ownLanguages = computed(() =>
    (props.stats?.languages ?? []).filter((language) => language.own).map((language) => language.id),
);
const unknownLanguages = computed(() =>
    (props.stats?.allLanguages ?? []).filter((language) => !knownLanguageIds.value.includes(language.id)),
);

function setBackground(event: Event): void {
    const input = event.target as HTMLInputElement;
    setOpenedBackground(input.value);
    input.value = background.value?.name ?? "";
}

function addLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    select.value = "";
    if (id.length > 0) setOpenedLanguages([...ownLanguages.value, id]);
}

function removeLanguage(id: string): void {
    setOpenedLanguages(ownLanguages.value.filter((language) => language !== id));
}

function skillTitle(skill: SheetSkill): string | undefined {
    const parts: string[] = [];
    const from = sourceText(skill.sources);
    if (from !== undefined) parts.push(skill.proficiency > 0 ? from : `${from}, but not proficient`);
    const expertise = sourceText(skill.expertiseSources);
    if (expertise !== undefined) parts.push(`Expertise ${expertise.charAt(0).toLowerCase()}${expertise.slice(1)}`);
    else if (skill.proficiency >= 2) parts.push("Expertise");
    return parts.length > 0 ? parts.join(" · ") : undefined;
}

function saveTitle(ability: SheetAbility): string | undefined {
    const from = sourceText(ability.saveSources);
    if (from === undefined || ability.saveProficiency > 0) return from;
    return `${from}, but not proficient`;
}

function onSkillToggle(skill: SheetSkill, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    setOpenedSkillProficiency(skill.id, checked ? 1 : 0);
}

function onSaveToggle(ability: SheetAbility, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    setOpenedSaveProficiency(ability.id, checked ? 1 : 0);
}

function passiveParts(): string[] {
    const perception = derived.value.skills["perception"];
    if (perception === undefined) return ["10", `Wisdom ${signed(modifierOf(derived.value, "wis"))}`];
    return ["10", `Perception ${signed(perception)}`];
}
</script>

<template>
    <div class="page">
        <header class="identity">
            <label class="field name">
                <span>Name</span>
                <input v-model="character.name" autocomplete="off" />
            </label>
            <div class="field">
                <span
                    >Class &amp; level
                    <em v-if="pendingClassChoices > 0" class="pending-note">{{
                        pendingText(pendingClassChoices)
                    }}</em></span
                >
                <span class="field-text" :title="classSummary || undefined">{{ classSummary || "—" }}</span>
            </div>
            <label class="field">
                <span
                    >Background
                    <em v-if="pendingBackgroundChoices > 0" class="pending-note">{{
                        pendingText(pendingBackgroundChoices)
                    }}</em></span
                >
                <input
                    :value="background?.name ?? ''"
                    :disabled="stats === undefined"
                    list="background-options"
                    autocomplete="off"
                    @change="setBackground"
                />
                <datalist id="background-options">
                    <option v-for="entry in stats?.backgrounds ?? []" :key="entry.id" :value="entry.name" />
                </datalist>
            </label>
            <label class="field">
                <span
                    >Race
                    <em v-if="pendingRaceChoices > 0" class="pending-note">{{
                        pendingText(pendingRaceChoices)
                    }}</em></span
                >
                <input
                    :value="stats?.race.name ?? ''"
                    :disabled="stats === undefined"
                    list="race-options"
                    autocomplete="off"
                    @change="setRace"
                />
                <datalist id="race-options">
                    <option v-for="entry in stats?.races ?? []" :key="entry.id" :value="entry.name" />
                </datalist>
            </label>
            <label class="field">
                <span>Subrace <em v-if="stats?.race.subracePending" class="pending-note">pending</em></span>
                <select
                    :value="stats?.race.subraceId ?? ''"
                    :disabled="!stats?.race.subraces.length"
                    @change="setOpenedSubrace(($event.target as HTMLSelectElement).value)"
                >
                    <option value="">{{ stats?.race.subraces.length ? "Choose…" : "—" }}</option>
                    <option v-for="entry in stats?.race.subraces ?? []" :key="entry.id" :value="entry.id">
                        {{ entry.name }}
                    </option>
                </select>
            </label>
            <label class="field">
                <span>Experience</span>
                <input v-model="character.xp" autocomplete="off" />
            </label>
        </header>

        <section class="col abilities-col">
            <ChoicePicker v-for="choice in choicesOf('ability')" :key="choiceKey(choice)" :choice="choice" />
            <div v-if="stats" class="ability-list">
                <div v-for="ability in stats.abilities" :key="ability.id" class="ability">
                    <span class="ability-name">{{ ability.abbreviation.toUpperCase() }}</span>
                    <button
                        type="button"
                        class="ability-mod rollable"
                        :class="{ error: ability.modifier.kind === 'error' }"
                        :title="simplifiedError(ability.modifier) ?? ROLL_HINT"
                        :aria-label="`Roll ${ability.name} check`"
                        @click="rollD20(ability.modifierReference, `${ability.name} check`, $event)"
                    >
                        {{ simplifiedText(ability.modifier) }}
                    </button>
                    <input
                        class="ability-score"
                        type="number"
                        :class="{ increased: ability.increase !== 0 }"
                        :aria-label="`${ability.name} score`"
                        :title="scoreTitle(ability)"
                        :value="ability.score + ability.increase"
                        @change="setScore(ability, $event)"
                    />
                </div>
            </div>
            <p v-else class="panel unavailable">Ability scores need the SRD 5.1 mod.</p>

            <div v-if="stats" class="panel">
                <h2>Saving throws</h2>
                <label
                    v-for="ability in stats.abilities"
                    :key="ability.id"
                    class="check-row"
                    :class="{ granted: ability.saveSources.length > 0 }"
                    :title="saveTitle(ability)"
                >
                    <input
                        type="checkbox"
                        :checked="ability.saveProficiency > 0"
                        :aria-label="`${ability.name} save proficiency`"
                        @change="onSaveToggle(ability, $event)"
                    />
                    <button
                        type="button"
                        class="derived-value rollable"
                        :class="{ error: ability.save.kind === 'error' }"
                        :title="simplifiedError(ability.save) ?? ROLL_HINT"
                        :aria-label="`Roll ${ability.name} saving throw`"
                        @click="rollD20(ability.saveReference, `${ability.name} saving throw`, $event)"
                    >
                        {{ simplifiedText(ability.save) }}
                    </button>
                    <span class="save-name">{{ ability.name }}</span>
                </label>
            </div>

            <div v-if="stats" class="panel skills-panel">
                <h2>Skills</h2>
                <ChoicePicker v-for="choice in choicesOf('skill')" :key="choiceKey(choice)" :choice="choice" />
                <ChoicePicker
                    v-for="choice in choicesOf('expertise')"
                    :key="choiceKey(choice)"
                    :choice="choice"
                    :exclude="expertiseExcluded"
                />
                <div class="skill-list">
                    <label
                        v-for="skill in stats.skills"
                        :key="skill.id"
                        class="check-row"
                        :class="{ granted: skill.sources.length > 0 }"
                        :title="skillTitle(skill)"
                    >
                        <input
                            type="checkbox"
                            :checked="skill.proficiency > 0"
                            :aria-label="`${skill.name} proficiency`"
                            @change="onSkillToggle(skill, $event)"
                        />
                        <button
                            type="button"
                            class="derived-value rollable"
                            :class="{ error: skill.modifier.kind === 'error' }"
                            :title="simplifiedError(skill.modifier) ?? ROLL_HINT"
                            :aria-label="`Roll ${skill.name} check`"
                            @click="rollD20(skill.modifierReference, `${skill.name} check`, $event)"
                        >
                            {{ simplifiedText(skill.modifier) }}
                        </button>
                        <span class="skill-name"
                            >{{ skill.name }} <em>{{ abilityLabel(skill.ability) }}</em
                            ><strong v-if="skill.proficiency >= 2" class="expertise-mark">E</strong></span
                        >
                    </label>
                </div>
            </div>

            <div class="panel senses">
                <h2>Senses</h2>
                <div class="sense">
                    <span>Passive Perception</span>
                    <StatInput
                        v-model="character.passivePerceptionBonus"
                        class="sense-value"
                        :signed="false"
                        :computed-value="derivedPassivePerception(derived)"
                        :parts="passiveParts()"
                        label="Passive Perception"
                    />
                </div>
                <div v-if="stats?.darkvision" class="sense granted" :title="sourceText([stats.darkvision.source])">
                    <span>Darkvision</span>
                    <span class="sense-value">{{ stats.darkvision.value }} ft</span>
                </div>
            </div>
        </section>

        <section class="col combat-col">
            <div class="lead">
                <label class="inspiration">
                    <input v-model="character.inspiration" type="checkbox" />
                    Inspiration
                </label>
                <div class="proficiency" :title="stats ? `From total level ${stats.level}` : undefined">
                    <span>Proficiency</span>
                    <strong aria-label="Proficiency bonus">{{ signed(derived.proficiency) }}</strong>
                </div>
            </div>

            <div class="vitals">
                <label class="vital">
                    <StatInput
                        v-model="character.armorClassBonus"
                        class="vital-mod"
                        :signed="false"
                        :computed-value="stats?.armorClassBase ?? 10"
                        :parts="stats?.armorClassParts ?? []"
                        label="Armor class"
                    />
                    <span>Armor class</span>
                </label>
                <label class="vital">
                    <StatInput
                        v-model="character.initiativeBonus"
                        class="vital-mod"
                        :computed-value="derivedInitiative(derived)"
                        :parts="[`Dex ${signed(modifierOf(derived, 'dex'))}`]"
                        label="Initiative"
                    />
                    <button
                        v-if="initiativeReference"
                        type="button"
                        class="caption rollable"
                        :title="ROLL_HINT"
                        @click="rollD20(initiativeReference, 'Initiative', $event)"
                    >
                        Initiative
                    </button>
                    <span v-else>Initiative</span>
                </label>
                <label class="vital">
                    <StatInput
                        v-model="character.speedBonus"
                        class="vital-mod"
                        :signed="false"
                        :computed-value="stats?.speed?.value ?? 30"
                        :parts="speedParts"
                        label="Speed"
                    />
                    <span>Speed (ft)</span>
                </label>
                <div class="vital" :title="stats?.size ? sourceText([stats.size.source]) : undefined">
                    <span class="vital-text">{{ stats?.size?.value ?? "—" }}</span>
                    <span>Size</span>
                </div>
            </div>

            <div class="panel hp">
                <h2>Hit points</h2>
                <div class="hp-line">
                    <label>
                        <input
                            :value="character.hp.current"
                            aria-label="Current hit points"
                            @change="setPlain($event, (value) => (character.hp.current = value), character.hp.current)"
                        />
                        <span>Current</span>
                    </label>
                    <label>
                        <StatInput
                            v-model="hitPointBonus"
                            class="hp-max"
                            :signed="false"
                            :computed-value="(stats?.hitPointMax ?? 0) - hitPointBonus"
                            :parts="hitPointParts"
                            label="Maximum hit points"
                        />
                        <span>Maximum</span>
                    </label>
                    <label>
                        <input
                            :value="character.hp.temp"
                            aria-label="Temporary hit points"
                            @change="setPlain($event, (value) => (character.hp.temp = value), character.hp.temp)"
                        />
                        <span>Temporary</span>
                    </label>
                </div>
                <div class="hp-meta">
                    <div class="dice">
                        <span>Hit dice</span>
                        <input
                            :value="hitDiceRemaining"
                            aria-label="Hit dice remaining"
                            @change="setHitDiceRemaining"
                        />
                        <span>/ {{ hitDiceTotal }}</span>
                        <span class="die">{{ hitDiceText }}</span>
                    </div>
                    <div class="death">
                        <button
                            type="button"
                            class="caption rollable"
                            :title="ROLL_HINT"
                            @click="rollD20('', 'Death saving throw', $event)"
                        >
                            Death saves
                        </button>
                        <span class="pip-label">S</span>
                        <span class="pips">
                            <button
                                v-for="(filled, index) in character.deathSaves.successes"
                                :key="`s-${index}`"
                                type="button"
                                class="pip"
                                :class="{ on: filled }"
                                :aria-pressed="filled"
                                :aria-label="`Death save success ${index + 1}`"
                                @click="character.deathSaves.successes[index] = !filled"
                            />
                        </span>
                        <span class="pip-label">F</span>
                        <span class="pips fail">
                            <button
                                v-for="(filled, index) in character.deathSaves.failures"
                                :key="`f-${index}`"
                                type="button"
                                class="pip"
                                :class="{ on: filled }"
                                :aria-pressed="filled"
                                :aria-label="`Death save failure ${index + 1}`"
                                @click="character.deathSaves.failures[index] = !filled"
                            />
                        </span>
                    </div>
                </div>
            </div>

            <div class="panel attacks">
                <h2>Attacks</h2>
                <AttacksPanel v-model:attacks="character.attacks" :stats="stats" />
            </div>
            <div class="panel grow-note">
                <h2>Other proficiencies</h2>
                <div v-if="stats" class="languages">
                    <span class="languages-label">Languages</span>
                    <span
                        v-for="language in stats.languages"
                        :key="language.id"
                        class="language"
                        :class="{ granted: language.sources.length > 0 }"
                        :title="sourceText(language.sources)"
                    >
                        {{ language.name }}
                        <button
                            v-if="language.own"
                            type="button"
                            :aria-label="`Remove ${language.name}`"
                            @click="removeLanguage(language.id)"
                        >
                            ×
                        </button>
                    </span>
                    <select aria-label="Add language" @change="addLanguage">
                        <option value="">Add…</option>
                        <option v-for="language in unknownLanguages" :key="language.id" :value="language.id">
                            {{ language.name }}
                        </option>
                    </select>
                </div>
                <ChoicePicker
                    v-for="choice in choicesOf('language')"
                    :key="choiceKey(choice)"
                    :choice="choice"
                    :exclude="knownLanguageIds"
                />
                <div v-for="group in grantGroups" :key="group.label" class="languages">
                    <span class="languages-label">{{ group.label }}</span>
                    <span
                        v-for="item in group.items"
                        :key="item.id"
                        class="language granted"
                        :title="sourceText(item.sources)"
                        >{{ item.name }}</span
                    >
                </div>
                <ChoicePicker
                    v-for="choice in choicesOf('armor', 'weapon', 'tool')"
                    :key="choiceKey(choice)"
                    :choice="choice"
                />
                <textarea v-model="character.otherProficiencies" rows="2" aria-label="Other proficiencies"></textarea>
            </div>
        </section>

        <section class="col notes-col">
            <div v-if="stats" class="panel classes">
                <h2>Classes</h2>
                <div v-for="(entry, index) in classes" :key="entry.id" class="class-row">
                    <span class="class-name">
                        {{ entry.name }}
                        <em v-if="index === 0" title="Starting class: its saving throws and full proficiencies apply"
                            >starting</em
                        >
                        <button
                            v-else-if="classes.length > 1"
                            type="button"
                            class="link"
                            :aria-label="`Make ${entry.name} the starting class`"
                            @click="setOpenedStartingClass(entry.id)"
                        >
                            make starting
                        </button>
                    </span>
                    <input
                        class="class-level"
                        type="number"
                        min="1"
                        max="20"
                        :value="entry.level"
                        :aria-label="`${entry.name} level`"
                        @change="setClassLevel(entry, $event)"
                    />
                    <button
                        type="button"
                        :aria-label="`Remove ${entry.name}`"
                        @click="setOpenedClassLevel(entry.id, 0)"
                    >
                        ×
                    </button>
                    <select
                        v-if="entry.subclasses.length > 0"
                        class="subclass"
                        :class="{ pending: entry.subclassPending }"
                        :value="entry.subclass.id ?? ''"
                        :disabled="entry.level < entry.subclassLevel"
                        :aria-label="`${entry.name} ${entry.subclassTitle}`"
                        @change="setOpenedSubclass(entry.id, ($event.target as HTMLSelectElement).value)"
                    >
                        <option value="">{{ subclassPlaceholder(entry) }}</option>
                        <option v-for="option in entry.subclasses" :key="option.id" :value="option.id">
                            {{ option.name }}
                        </option>
                    </select>
                </div>
                <select v-if="addableClasses.length > 0" class="add-class" aria-label="Add class" @change="addClass">
                    <option value="">{{ classes.length === 0 ? "Choose a class…" : "Add class…" }}</option>
                    <option v-for="option in addableClasses" :key="option.id" :value="option.id">
                        {{ option.name }}
                    </option>
                </select>
            </div>

            <div class="panel features">
                <h2>Features</h2>
                <ChoicePicker v-for="choice in choicesOf('option')" :key="choiceKey(choice)" :choice="choice" />
                <div class="feature-list">
                    <article v-for="trait in stats?.traits ?? []" :key="traitKey(trait)" class="feature">
                        <div class="feature-head">
                            <button
                                type="button"
                                class="toggle"
                                :aria-expanded="openFeatures.has(traitKey(trait))"
                                :aria-label="`Toggle ${trait.name}`"
                                @click="toggleFeature(traitKey(trait))"
                            >
                                {{ openFeatures.has(traitKey(trait)) ? "▾" : "▸" }}
                            </button>
                            <strong>{{ trait.name }}</strong>
                            <em>{{ trait.source.name }}{{ trait.level === undefined ? "" : ` ${trait.level}` }}</em>
                        </div>
                        <template v-if="openFeatures.has(traitKey(trait))">
                            <p v-for="(paragraph, index) in trait.description.split('\n\n')" :key="index">
                                {{ paragraph }}
                            </p>
                        </template>
                    </article>
                    <article v-for="feature in character.features" :key="feature.id" class="feature">
                        <div class="feature-head">
                            <button
                                type="button"
                                class="toggle"
                                :aria-expanded="openFeatures.has(feature.id)"
                                :aria-label="`Toggle ${feature.name || 'feature'}`"
                                @click="toggleFeature(feature.id)"
                            >
                                {{ openFeatures.has(feature.id) ? "▾" : "▸" }}
                            </button>
                            <input v-model="feature.name" aria-label="Feature name" autocomplete="off" />
                            <button type="button" aria-label="Remove feature" @click="removeFeature(feature.id)">
                                ×
                            </button>
                        </div>
                        <textarea
                            v-if="openFeatures.has(feature.id)"
                            v-model="feature.text"
                            rows="2"
                            aria-label="Feature description"
                        ></textarea>
                    </article>
                </div>
                <button type="button" class="text-button" @click="addFeature">Add feature</button>
            </div>
        </section>
    </div>
</template>

<style scoped>
input[type="number"] {
    appearance: textfield;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
}

.page {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: 16.5rem minmax(0, 1fr) 16rem;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.55rem 0.7rem;
    padding: 0.7rem 0.75rem 0.8rem;
    box-sizing: border-box;
    color: #1b120c;
    font-family: Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif;
    font-size: 15px;
}

.identity {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1.5fr 1.1fr 1fr 0.8fr 0.9fr 0.6fr;
    gap: 0.35rem 0.8rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    border-bottom: 1px solid #3a2a1e;
    min-width: 0;
}

.field span,
.panel h2,
.sense > span:first-child,
.proficiency span,
.vital > span:last-child,
.hp-line label > span:last-child,
.dice > span:first-child,
.death > span:first-child,
.caption.rollable {
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5a4032;
    font-weight: 700;
}

.field input,
.panel textarea,
.panel input,
.vital input,
.ability-score,
.proficiency input,
.dice input,
.hp-line input {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 0;
    min-width: 0;
    width: 100%;
}

.field input:focus,
.panel textarea:focus,
.panel input:focus,
.vital input:focus,
.ability-score:focus,
.proficiency input:focus,
.dice input:focus,
.hp-line input:focus {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

.name input {
    font-size: 1.25rem;
}

.col {
    min-height: 0;
    min-width: 0;
}

.abilities-col,
.combat-col,
.notes-col {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.ability-list {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
}

.ability {
    display: grid;
    grid-template-columns: 2.4rem 1fr 2.4rem;
    align-items: center;
    border: 1px solid #3a2a1e;
    padding: 0.05rem 0.35rem;
    background: rgba(255, 252, 245, 0.45);
}

.ability-name {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
}

.ability-mod {
    font-size: 1.35rem;
    width: 100%;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.derived-value {
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ability-mod.error,
.derived-value.error {
    color: #8a2e24;
}

button.rollable {
    border: none;
    background: transparent;
    font-family: inherit;
    padding: 0;
    cursor: pointer;
}

button.rollable:not(.caption) {
    color: inherit;
    font-size: inherit;
}

button.rollable:hover {
    color: #8a5a2a;
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}

button.rollable:focus-visible {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

.unavailable {
    margin: 0;
    font-size: 0.8rem;
    color: #5a4032;
}

.ability-score {
    width: 2.4rem;
    text-align: center;
    background: #e7dcc8;
    border: none;
    font: inherit;
    color: inherit;
    padding: 0.15rem 0;
}

.panel {
    border: 1px solid #3a2a1e;
    background: rgba(255, 252, 245, 0.35);
    padding: 0.3rem 0.45rem 0.4rem;
    min-height: 0;
}

.panel h2 {
    margin: 0 0 0.2rem;
}

.check-row {
    display: grid;
    grid-template-columns: 0.85rem 2.4rem minmax(0, 1fr);
    gap: 0.3rem;
    align-items: center;
    margin: 0.08rem 0;
}

.skill-name em {
    font-style: normal;
    color: #5a4032;
    font-size: 0.75rem;
}

.skills-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.skill-list {
    overflow: auto;
    min-height: 0;
}

input[type="checkbox"] {
    appearance: none;
    width: 0.8rem;
    height: 0.8rem;
    margin: 0;
    border: 1.5px solid #1b120c;
    background: transparent;
    display: grid;
    place-content: center;
}

input[type="checkbox"]:checked::after {
    content: "";
    width: 0.42rem;
    height: 0.42rem;
    background: #1b120c;
}

input[type="checkbox"]:focus-visible {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

.sense {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 3.5rem;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.1rem 0;
}

.sense + .sense {
    border-top: 1px solid #e6dac8;
}

.sense > span:first-child {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sense-value,
.sense-value :deep(.stat-input) {
    text-align: right;
}

.sense.granted {
    cursor: help;
}

.vital-text {
    font-size: 1.55rem;
}

.lead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
}

.inspiration,
.proficiency {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.proficiency strong {
    min-width: 2.6rem;
    text-align: center;
    border-bottom: 1px solid #3a2a1e;
    font-size: 1.15rem;
    font-weight: 400;
}

.proficiency[title] {
    cursor: help;
}

.field-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.field > .field-text {
    font-size: inherit;
    letter-spacing: 0;
    text-transform: none;
    color: inherit;
    font-weight: 400;
}

.hp-max {
    font-size: 1.15rem;
}

.class-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 2.4rem 1rem;
    align-items: center;
    gap: 0.1rem 0.35rem;
    padding: 0.1rem 0;
}

.class-row + .class-row {
    border-top: 1px solid #d9cbb6;
}

.class-name em,
.class-name .link {
    font-style: normal;
    font-size: 0.7rem;
    color: #5a4032;
}

.class-level {
    text-align: center;
    background: #e7dcc8;
    padding: 0.05rem 0;
}

.class-row button,
.classes select {
    border: none;
    background: transparent;
    color: #5a4032;
    font: inherit;
    padding: 0;
    cursor: pointer;
}

.class-row .link {
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}

.subclass {
    grid-column: 1 / -1;
    font-size: 0.85rem;
}

.subclass.pending {
    border-left: 2px solid #8a2e24;
    padding-left: 0.3rem;
    color: #8a2e24;
}

.subclass:disabled {
    cursor: default;
    opacity: 0.75;
}

.add-class {
    margin-top: 0.2rem;
}

.expertise-mark {
    margin-left: 0.3rem;
    font-size: 0.65rem;
    color: #8a5a2a;
}

.vitals {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
}

.vital {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid #3a2a1e;
    padding: 0.2rem 0.2rem 0.3rem;
    background: rgba(255, 252, 245, 0.45);
}

.vital input,
.vital-mod {
    font-size: 1.55rem;
    text-align: center;
    width: 100%;
}

.hp-line {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
}

.hp-line label,
.dice,
.death {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.05rem;
}

.hp-line input,
.dice input {
    text-align: center;
    font-size: 1.15rem;
}

.hp-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.45rem;
}

.dice {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
}

.dice input {
    width: 2rem;
}

.die {
    margin-left: 0.3rem;
    font-size: 0.85rem;
    color: #5a4032;
}

.death {
    flex-direction: row;
    align-items: center;
    gap: 0.45rem;
}

.pips {
    display: flex;
    gap: 0.28rem;
}

.pip {
    width: 0.85rem;
    height: 0.85rem;
    border-radius: 50%;
    border: 1.5px solid #1b120c;
    background: transparent;
    padding: 0;
    cursor: pointer;
}

.pip.on {
    background: #1b120c;
}

.fail .pip.on {
    background: #8a2e24;
    border-color: #8a2e24;
}

.attacks {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 6rem;
}

.pip-label {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #5a4032;
}

.feature-list button,
.text-button {
    border: none;
    background: transparent;
    color: #5a4032;
    cursor: pointer;
    font: inherit;
    padding: 0;
}

.text-button {
    align-self: flex-start;
    margin-top: 0.25rem;
    text-decoration: underline;
    text-underline-offset: 0.15rem;
}

.languages {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.2rem 0.45rem;
    margin-bottom: 0.25rem;
}

.languages-label {
    font-size: 0.72rem;
    color: #5a4032;
}

.language {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
}

.language button,
.languages select {
    border: none;
    background: transparent;
    color: #5a4032;
    font: inherit;
    padding: 0;
    cursor: pointer;
}

.granted .skill-name,
.granted .save-name,
.language.granted {
    text-decoration: underline dotted #8a5a2a;
    text-underline-offset: 0.2rem;
    cursor: help;
}

.field .pending-note {
    font-style: normal;
    color: #8a2e24;
    text-transform: none;
    letter-spacing: 0;
}

.field select {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 0;
    min-width: 0;
    width: 100%;
}

.field select:focus {
    outline: 1px solid #8a5a2a;
    outline-offset: 1px;
}

.ability-score.increased {
    text-decoration: underline dotted #8a5a2a;
    text-underline-offset: 0.2rem;
}

.granted-block {
    margin-bottom: 0.25rem;
    font-size: 0.85rem;
}

.granted-block summary {
    cursor: pointer;
}

.granted-block em {
    font-style: normal;
    color: #5a4032;
    font-size: 0.75rem;
}

.granted-block ul {
    margin: 0.15rem 0 0;
    padding-left: 1.1rem;
}

.granted-block p {
    margin: 0.2rem 0 0;
}

.grow-note textarea,
.feature-list textarea {
    resize: none;
    width: 100%;
    box-sizing: border-box;
}

.features {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.feature-list {
    overflow: auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.feature-head {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
}

.feature-head .toggle {
    width: 0.8rem;
    flex: none;
    font-size: 0.75rem;
}

.feature-head em {
    margin-left: auto;
    flex: none;
    white-space: nowrap;
    font-style: normal;
    color: #5a4032;
    font-size: 0.75rem;
}

.feature p {
    margin: 0.3rem 0 0;
    font-size: 0.85rem;
}

.feature textarea {
    margin-top: 0.3rem;
}

.feature-list input {
    flex: 1;
    font-weight: 700;
    border-bottom: 1px solid #d9cbb6;
}
</style>
