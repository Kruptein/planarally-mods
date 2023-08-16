import type { Tracker } from "@planarally/mod-api";

import { loadedDataBlocks } from "./data";

// This function will be called by PA everytime a tracker receives an update
// This happens because we're exporting this function in `main.ts` so that it is visible to PA
//
// Our mod will do something particular to relevant trackers:
// We will hide the real HP by tracking it in a datablock
// the HP tracker will only change everytime it drops below or goes over a configurable portion of the max hp value
// this could be interesting to give some info to players without giving all the info
// Additionally we're changing the colour of the tracker to become red if the HP drops below 50%
export function preTrackerUpdate(
    id: number,
    tracker: Tracker,
    delta: Partial<Tracker>,
): Partial<Tracker> {
    // Our mod is only interested in changes to the actual tracker value
    if (delta.value !== undefined) {
        const dataBlock = loadedDataBlocks.get(id);
        if (dataBlock) {
            // We need to make sure that if someone sets the tracker directly
            // Our internal `realValue` is also updated, or our tracker and dataBlock will be out of sync
            // Causing the tracker to potentially suddenly update when it gets re-synced with the dataBlock
            //
            // Potential Pitfall:
            //   It's possible that another mod down the chain modifies the HP of this tracker even further for some reason.
            //   Our dataBlock would then still be out of sync despite our best efforts here.
            //   These inter-mod intricacies are out of the scope of this example
            const trackerDb = dataBlock.get("trackers").value.get(tracker.uuid);
            // Only trackers that actually have obfuscation enabled are interesting to us.
            if (trackerDb?.useObfuscation) {
                trackerDb.realValue = delta.value;

                // As explained at the top, we want to modify the HP tracker to be split in X parts (X configurable)
                // And only show the part that the real HP value is currently in
                const part = tracker.maxvalue / trackerDb.parts;
                delta.value = Math.round(part * Math.ceil(delta.value / part));
                // Lastly we update the color to be green or red depending on the percentage HP
                delta.primaryColor = delta.value / tracker.maxvalue > 0.5 ? "green" : "red";
            }
        }
    }
    return delta;
}
