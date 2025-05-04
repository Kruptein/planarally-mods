# A simple character sheet

This is a very simple small PA mod that will show some things you can do:

- store/retrieve/update data on the server using dataBlocks
- add a new tab to the Shape Edit dialog under certain conditions

I went ahead and added way too many comments to overexplain things to hopefully make things clear.
I have also added information on potential pitfalls or things that you should pay attention to/avoid.

## What does the mod do?

This sample mod adds a new tab to the Shape Edit dialog, but only for shapes that have been configured as characters.
This new tab acts as a very rudimentary character sheet, you can add a stat which has a name and some type (text / number / checkbox).

The first aspect of the mod is to showcase how a mod can store data on the server, in this case our mini character sheet.

## Recommended reading order

I recommend you to check the files in this order:

- main.ts: Mod initialization
- data.ts: Information on datablocks
- CharTab.vue: Rendering some custom data
