<script setup lang="ts">
import type { ComputedRef } from "vue";
import { useTemplateRef, watch, watchEffect } from "vue";
import ShortTrack from "./ShortTrack.vue";
import { defaultShipData } from "./data/ship";
import { api } from "./main";

const tabPanel = useTemplateRef("tab-panel");

const props = defineProps<{ tabSelected: ComputedRef<boolean> }>();

// When the tab is opened, center it on the screen as it is a big UI element
// and we almost always want to see most of it at once.
watchEffect(() => {
    if (props.tabSelected.value) {
        const container = tabPanel.value?.closest<HTMLElement>(".modal-container");
        if (container) {
            const containerX = (window.innerWidth - container.offsetWidth) / 2;
            const containerY = (window.innerHeight - container.offsetHeight) / 2;
            container.style.left = `${containerX}px`;
            container.style.top = `${containerY}px`;
        }
    }
});

const {
    data: stats,
    load,
    save,
} = api.useShapeDataBlock("data", { defaultData: () => defaultShipData });

watch(
    () => api.systemsState.selected.reactive.focus,
    async (shapeId) => {
        if (shapeId) load(shapeId);
    },
    { immediate: true },
);
</script>

<template>
    <div id="wildsea-ship" ref="tab-panel">
        <div class="character-sheet">
            <div class="logo">
                <img
                    src="./assets/legal-fireflyslight.png"
                    alt="By firefly's light license logo"
                    title="By firefly's light license logo"
                />
                <h1>THE WILDSEA</h1>
                <p>OFFICIAL SHIP SHEET</p>
            </div>
            <div class="box conditions">
                <label>CONDITIONS</label>
                <textarea v-model.lazy="stats.conditions" @change="save"></textarea>
            </div>
            <div class="box stakes">
                <label>STAKES</label>
                <div>
                    <input type="number" min="0" v-model.lazy="stats.stakesUsed" @change="save" />
                    <input type="number" min="0" v-model.lazy="stats.stakesTotal" @change="save" />
                    <div />
                </div>
            </div>
            <div class="box reputation">
                <label>REPUTATION</label>
                <textarea v-model.lazy="stats.reputation" @change="save"></textarea>
            </div>
            <div class="box name">
                <label>NAME</label>
                <textarea v-model.lazy="stats.name" @change="save"></textarea>
            </div>
            <div class="box fittings">
                <label>FITTINGS</label>
                <div class="box fittings-motifs">
                    <label>MOTIFS</label>
                    <textarea v-model.lazy="stats.fittings.motifs" @change="save"></textarea>
                </div>
                <div class="box fittings-armaments">
                    <label>ARMAMENTS</label>
                    <textarea v-model.lazy="stats.fittings.armaments" @change="save"></textarea>
                </div>
                <div class="box fittings-outriders">
                    <label>OUTRIDERS</label>
                    <textarea v-model.lazy="stats.fittings.outriders" @change="save"></textarea>
                </div>
            </div>
            <div class="box undercrew">
                <label>UNDERCREW</label>
                <textarea v-model.lazy="stats.undercrew" @change="save"></textarea>
            </div>
            <div class="box ratings">
                <label>RATINGS</label>
                <ShortTrack label="ARMOUR" v-model="stats.ratings.armour" @change="save" />
                <ShortTrack label="SEALS" v-model="stats.ratings.seals" @change="save" />
                <ShortTrack label="SPEED" v-model="stats.ratings.speed" @change="save" />
                <ShortTrack label="SAWS" v-model="stats.ratings.saws" @change="save" />
                <ShortTrack label="STEALTH" v-model="stats.ratings.stealth" @change="save" />
                <ShortTrack label="TILT" v-model="stats.ratings.tilt" @change="save" />
            </div>
            <div class="box cargo">
                <label>CARGO AND PASSENGERS</label>
                <textarea v-model.lazy="stats.cargo" @change="save"></textarea>
            </div>
            <div class="box design">
                <label>DESIGN</label>
                <div class="box design-size">
                    <label>SIZE</label>
                    <textarea v-model.lazy="stats.design.size" @change="save"></textarea>
                </div>
                <div class="box design-frame">
                    <label>FRAME</label>
                    <textarea v-model.lazy="stats.design.frame" @change="save"></textarea>
                </div>
                <div class="box design-hull">
                    <label>HULL</label>
                    <textarea v-model.lazy="stats.design.hull" @change="save"></textarea>
                </div>
                <div class="box design-bite">
                    <label>BITE</label>
                    <textarea v-model.lazy="stats.design.bite" @change="save"></textarea>
                </div>
                <div class="box design-engine">
                    <label>ENGINE</label>
                    <textarea v-model.lazy="stats.design.engine" @change="save"></textarea>
                </div>
            </div>
            <div class="box notes">
                <label>NOTES</label>
                <textarea v-model.lazy="stats.notes" @change="save"></textarea>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "sass:math";

$fontSize: 19px;
$lineWidth: 2px;
$xPadding: 10px;
$lineColor: #ccc;
$backgroundColor: #fff;

@font-face {
    font-family: "Bebas Neue";
    src: local("Bebas Neue"), url("./assets/BebasNeue-Regular.woff2?no-inline"), format("woff2");
}

#wildsea-ship {
    font-family: "Bebas Neue", sans-serif;
    font-size: $fontSize;
    background-color: #dfdfdf;

    overflow: auto;
    height: 80vh;
    width: 80vw;

    .character-sheet {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-auto-rows: 3.75rem;
        gap: 0.8rem;
        column-gap: 1.2rem;
        margin: 1.5rem;
    }

    .box {
        display: flex;
        flex-direction: column;

        border: solid 1px #2f2921;
        border-radius: 1rem;

        overflow: hidden;

        grid-column: span 2;
        grid-row: span 2;

        &:has(> .box) {
            border: none;
        }

        > .box {
            margin-top: 0.5rem;

            > label {
                background-color: #636559;
            }
        }

        label {
            display: block;
            padding: 0.2rem 0.5rem;
            padding-left: 1rem;

            background-color: black;
            color: white;
            font-size: 30px;
        }

        textarea {
            width: 100%;
            height: 100%;
            border: none;
            resize: none;
            outline: none;

            // Textarea styling taken from
            // https://codepen.io/lachieh/pen/GEQrow

            font-size: $fontSize;
            padding: math.div($fontSize, 3) $xPadding;
            background-attachment: local;
            background-image:
                linear-gradient(
                    to right,
                    $backgroundColor,
                    $backgroundColor $xPadding,
                    transparent $xPadding
                ),
                linear-gradient(
                    to left,
                    $backgroundColor,
                    $backgroundColor $xPadding,
                    transparent $xPadding
                ),
                repeating-linear-gradient(
                    $backgroundColor,
                    $backgroundColor $fontSize * 2-$lineWidth,
                    $lineColor $fontSize * 2-$lineWidth,
                    $lineColor $fontSize * 2
                );
            line-height: $fontSize * 2;
        }
    }

    .simple-track {
        display: flex;

        label {
            width: 7.5rem;
        }
    }

    .logo {
        display: grid;
        grid-template-columns: 100px auto;
        grid-template-rows: auto auto;

        grid-column: span 3;
        grid-row: span 2;

        * {
            margin: 0;
            color: #636559;
            text-align: center;
        }

        h1 {
            font-size: min(8vh, 72px);
            font-weight: normal;
        }

        img {
            width: 100px;
            grid-row: span 2;
        }
    }

    .stakes {
        grid-column: span 1;
        display: flex;
        background-color: white;

        > div:last-child {
            position: relative;
            width: 100%;
            height: 100%;

            > input {
                position: absolute;
                width: min(5rem, 50%);
                height: min(5rem, 50%);

                appearance: textfield;
                border: none;
                font-size: $fontSize;
                outline: none;
                text-align: center;

                &::-webkit-inner-spin-button,
                &::-webkit-outer-spin-button {
                    appearance: none;
                    margin: 0;
                }

                &:first-child {
                    top: 0.4rem;
                    left: 0.4rem;
                }

                &:last-of-type {
                    bottom: 0.4rem;
                    right: 0.4rem;
                }
            }

            > div {
                content: "";
                position: absolute;
                width: 2px;
                height: 100%;
                left: 50%;
                transform: rotate(45deg);

                background-color: #2f2921;
            }
        }
    }

    .reputation {
        grid-row: span 6;
    }

    .fittings {
        grid-row: span 16;
        display: flex;
        flex-direction: column;

        .fittings-motifs {
            flex-grow: 3;
        }

        .fittings-armaments {
            flex-grow: 1;
        }

        .fittings-outriders {
            flex-grow: 2;
        }
    }

    .undercrew {
        grid-row: span 10;
    }

    .ratings {
        grid-row: span 5;
    }

    .cargo {
        grid-row: span 6;
    }

    .design {
        grid-row: span 9;
    }

    .notes {
        grid-column: span 4;
        grid-row: span 6;
    }
}
</style>
