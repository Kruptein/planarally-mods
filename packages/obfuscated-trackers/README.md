# Obfuscated Trackers

This is a small PA mod that shows interaction with trackers, it's aimed to share some info about a shape's tracker without revealing the details.

E.g. suppose the players are fighting a dragon. You might want to hint the players as to roughly how healthy the dragon still is after a bunch of hits.
Instead of showing the exact HP the dragon has left, we instead are interested in showing how many 1/5ths of health they've already lost.
Essentially we're visually showing 5 bars and only remove a bar if the party has done more than 20% damage.

To accomplish this we need two things:

- we need to store the real tracker data somewhere
- we need to ensure that modifications to the tracker update the real data and the obfuscated data

To track the real data as well as some small configuration options we use a DataBlock.

To handle tracker changes we can register a handler with PA so that we get called when a tracker is about to be updated.

We also register a custom tab in the Shape Edit dialog so that we can enable/disable obfuscation on a per tracker basis as well as how many segments the obfuscated version should have.

## How it all works together

This example might be a bit confusing to follow in the code, so I'm going to try to explain the overarching flow of the data here.

A new shape tab is added to enable obfuscation for a particular tracker as well as providing the number of segments it should have while obfuscated.
This new shape tab also shows the real value and max value for the tracker allowing you to modify the data directly here while it's obfuscated.

We however also allow the modification of the tracker through the regular tracker and selection info channels. [^1]

All changes to trackers are routed through the `preTrackerUpdate` handler in `handlers.ts`.
This will receive the new values for the tracker, so this is the place where we need to run the obfuscation as well as updating the dataBlock with the real data.

[^1]: The relative mode of the selection info does not work with this mod.
