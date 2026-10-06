import type { LocalId, Sync, Tracker, TrackerId } from "@planarally/mod-api";

import { getDataBlock } from "./data";
import { api } from "./main";

// This function will be called by PA everytime a tracker receives an update
// This function is visible to PA because we tapped the hook in initGame
//
// Our mod will do something particular to relevant trackers:
// We will hide the real HP by tracking it in a datablock
// the HP tracker will only change everytime it drops below or goes over a configurable portion of the max hp value
// this could be interesting to give some info to players without giving all the info
export function preTrackerUpdate(
    delta: Partial<Tracker>,
    context: { id: LocalId; tracker: Tracker; syncTo: Sync },
): Partial<Tracker> {
    // Our mod is only interested in changes to the actual tracker value or max value
    // and changes that are to be synced to the server
    // in other words, if the update comes from the server, we're not going to interact with it
    // otherwise this could lead to two clients looping endlessly responding to each other
    if (context.syncTo.server && (delta.value !== undefined || delta.maxvalue !== undefined)) {
        const dataBlock = getDataBlock(context.id);
        if (dataBlock) {
            // We need to make sure that if someone sets the tracker directly
            // Our internal `realValue` is also updated, or our tracker and dataBlock will be out of sync
            // Causing the tracker to potentially suddenly update when it gets re-synced with the dataBlock
            //
            // Potential Pitfall:
            //   It's possible that another mod down the chain modifies the HP of this tracker even further for some reason.
            //   Our dataBlock would then still be out of sync despite our best efforts here.
            //   These inter-mod intricacies are out of the scope of this example
            const trackerDb = dataBlock.data.get(context.tracker.uuid);
            // Only trackers that actually have obfuscation enabled are interesting to us.
            if (trackerDb?.useObfuscation) {
                if (delta.value !== undefined) {
                    trackerDb.realValue = delta.value;
                }
                if (delta.maxvalue !== undefined) {
                    trackerDb.realMaxValue = delta.maxvalue;
                }
                dataBlock.sync();

                // As explained at the top, we want to modify the HP tracker to be split in X parts (X configurable)
                // And only show the part that the real HP value is currently in
                const part = trackerDb.realMaxValue / trackerDb.parts;
                delta.value = Math.ceil(trackerDb.realValue / part);
                delta.maxvalue = trackerDb.parts;
            }
        }
    }
    return delta;
}

// Additionally we're changing the colour of the tracker to become red if the HP drops below 50%
// We however do this only after the tracker actually updated, as other mods could have modified the tracker value further.
// Mostly also to show events as well
export function postTrackerUpdate(context: {
    id: LocalId;
    trackerId: TrackerId;
    syncTo: Sync;
    delta: Partial<Tracker>;
}): void {
    const { delta } = context;
    // A bunch of the logic is duplicated here
    // to keep the code readible as an example, we're not doing anything clever with extracting the common logic.
    if (context.syncTo.server && (delta.value !== undefined || delta.maxvalue !== undefined)) {
        const dataBlock = getDataBlock(context.id);
        if (dataBlock) {
            const trackerDb = dataBlock.data.get(context.trackerId);
            if (trackerDb?.useObfuscation) {
                const tracker = api.systems.trackers.get(context.id, context.trackerId, false);
                if (!tracker || !tracker.value || !tracker.maxvalue) return;
                const procent = tracker.value / tracker.maxvalue;
                let targetColour = "green";
                if (procent <= 0.5) {
                    targetColour = "red";
                }
                if (targetColour !== tracker.primaryColor) {
                    api.systems.trackers.update(
                        context.id,
                        context.trackerId,
                        { primaryColor: targetColour },
                        { server: true, ui: true },
                    );
                }
            }
        }
    }
}
