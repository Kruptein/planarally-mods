# A simple PA Mod

This is a very simple small PA mod that will show some things you can do:

-   store/retrieve/update data on the server using dataBlocks
-   interact with PA trackers
-   add a new tab to the Shape Edit dialog under certain conditions

I went ahead and added way too many comments to overexplain things to hopefully make things clear.
I have also added information on potential pitfalls or things that you should pay attention to/avoid.

## What does the mod do?

This sample mod adds a new tab to the Shape Edit dialog, but only for shapes that have been configured as characters.
This new tab acts as a very rudimentary character sheet, containing only 2 values: HP and AC.

The first aspect of the mod is to showcase how a mod can store data on the server, in this case our mini character sheet.

Secondly our mod creates and manages a new tracker for each character,
that is associated with the HP value, but in such a way that not the exact HP value is shown,
but a vague approximation to give a hint towards the general vitality of the character.

This can be useful for cases where you want players to have control over their exact HP,
but don't like detailed sharing of this information to other players.
You could do something similar as a DM for monsters to give some information to your players
without telling the exact HP the monster has left.

## Recommended reading order

I recommend you to check the files in this order:

-   main.ts: Mod initialization
-   data.ts: Information on datablocks
-   handlers.ts: Interacting with trackers
-   CharTab.vue: Rendering some custom data
