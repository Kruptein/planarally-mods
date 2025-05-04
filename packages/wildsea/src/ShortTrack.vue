<script setup lang="ts">
defineProps<{
    label: string;
}>();

const trackValue = defineModel<number>({ required: true });

const emit = defineEmits<{
    (e: "change", value: number): void;
}>();

const trackLength = 6;

function setTrackValue(value: number) {
    trackValue.value = value;
    emit("change", value);
}
</script>

<template>
    <div class="short-track">
        <label>{{ label }}</label>
        <div class="track">
            <div class="track-item" v-for="trackItem in trackLength" :key="trackItem">
                <div class="track-item-outer" @click="setTrackValue(trackItem)">
                    <div
                        class="track-item-inner"
                        :class="{ completed: trackItem <= trackValue }"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
$borderWidth: 3px;
$outerSize: 35px;
$innerSize: 25px;

.short-track {
    display: flex;
    align-items: stretch;
    margin: 0.1rem;

    height: 3rem;

    background-color: #636559;
    border: solid 3px #636559;
    border-radius: 1rem;

    overflow: clip;
}

label {
    display: grid;
    align-items: center;

    padding: 0.5rem;
    width: 5.75rem;

    color: white;
    background-color: #636559;

    font-size: 24px;
}

.track {
    display: flex;
    justify-content: space-between;

    padding: 0 0.25rem;

    flex-grow: 1;

    border-top-left-radius: 1rem;
    border-bottom-left-radius: 1rem;
    margin-left: -0.75rem;

    background-color: white;
}

.track-item {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: flex-end;

    flex-grow: 1;

    &:first-child {
        flex-grow: 0;
    }

    .track-item-outer {
        position: relative;

        display: grid;
        place-items: center;

        width: $outerSize;
        height: $outerSize;
        border-radius: 50%;
        border: $borderWidth solid #3d4036;
        background-color: white;

        .track-item-inner {
            width: $innerSize;
            height: $innerSize;
            border-radius: 50%;
            border: $borderWidth solid #3d4036;
        }

        &:hover {
            cursor: pointer;

            .track-item-inner {
                background-color: #aaa;
            }
        }
    }

    &:not(:hover) .completed {
        background-color: #3d4036;
    }

    // Ensure hover selects all previous items
    &:has(~ .track-item:hover) .track-item-inner {
        background-color: #3d4036;
    }

    // Ensure hover deselects all next items
    &:hover .track-item-inner,
    &:hover ~ .track-item .track-item-inner {
        background-color: white;
    }

    // full line through the middle

    &::before {
        position: absolute;
        content: "";
        border-top: $borderWidth solid #3d4036;
        border-bottom: $borderWidth solid #3d4036;
        background-color: white;
        height: 5px;
        // 40px radius - 2 * 3px border
        width: calc(100% - ($outerSize - 2 * $borderWidth));
        // 5px offset for height
        top: calc(50% - 5px);
        // circle width - 3px border
        right: $outerSize - $borderWidth;
        z-index: 1;
    }

    // Drop start/end lines

    &:first-child::before {
        content: none;
    }
}
</style>
