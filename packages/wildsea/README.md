# Wilsea RPG integration

This mod integrates some aspects of the wildsea RPG system into PlanarAlly.

## Legal

The Wildsea is the copyright of Quillhound Studios and Felix Isaacs.
The PlanarAlly Wilsea RPG integration is an independent production by Kruptein and is not affiliated with Mythworks or Felix Isaacs. It is published under the By Firefly’s Light License.

## What's included

It currently offers the ability to handle the character sheet of a wildsea ship. [^1]

It adds a context-menu entry to all shapes which allows you to add or remove a ship.
When added, a new tab will be visible in the shapes' properties dialog.

## Future

The plan is to add support for regular character sheets and also integrate with the dice system.
Though no particular timeline is currently available.

## Technical details

Mod API concepts used:

- UI
    - (conditional) shape tab
    - shape context-menu entry
- Server saved data (datablocks)
    - room data for version tracking and relevant shape ids
    - shape data for each shape with ship data

Because we use the datablocks directly as our data store any change we sync, is automatically replicated to other clients.

The mod opts for both a campaign wide (i.e. room) datablock as well as shape specific datablocks.
The room datablock is used mostly for organizational purposes and makes some things much faster, not having to do a roundtrip to the database for every shape selected.
The shape datablocks are the ones actually containing the data.

The current implementation only syncs the ship sheet data when it unfocuses, so any change made is not visible to other clients until the blur happens on the relevant input.
You could implement this better with timers or to swap to input events instead of change events, though that would be quite network heavy.

[^1]: The undercrew section of the ship sheet is currently still one big textarea.
