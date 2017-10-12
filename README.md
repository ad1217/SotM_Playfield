# Deck Generator/Playfield

This project has two major parts: a deck generator, and a virtual
playfield. The purpose is to allow for creating and playing custom
decks in a physical card game, or generation of decks for use in
Tabletop Simulator. Currently, there is support for [Sentinels of the
Multiverse](https://boardgamegeek.com/boardgame/102652/sentinels-multiverse)
(SotM), a co-op fixed-deck card game based on super heros, though
other templates could be added relatively easily.


## Deck Generator

Supports generating custom hero, villain, and environment decks for
SotM. Currently based on uploading JSON input files, though minimal
editing in the browser has also been implemented.

**Requires installation of fonts on local computer, as they cannot be
distributed due to their license**

  * ~~SC logo = [Detectives, Inc](http://www.blambot.com/font_detectivesinc.shtml)~~
      * not actually needed, as the glyphs are baked in
  * Hero/Villain HP & Villain Names = [Armor Piercing](http://www.blambot.com/font_armorpiercing.shtml)
  * Card Headers & HP = [Crash Landing](http://www.blambot.com/font_crashlanding.shtml)
  * Card Text = [Red State Blue State](http://www.blambot.com/font_rsbs.shtml)

Templates are based on those from BoardGameGeek user Koga, found here:
https://boardgamegeek.com/thread/813176/card-templates/, but have been
converted to SVG and rather heavily modified/cleaned up.

## Playfield

Can load decks created by the generator. In theory, can play any deck
from Tabletop Simulator, with minor effort (it needs to be pointed at
the right part of the JSON). This allows for playing many offcial and
unoffical (such as 
[The Cauldron](http://tangent.meromorph.com/cauldron/), a popular fan
expansion) decks.


### Controls:

Best on a touch screen, but works okay with a mouse.

  * primary controls are dragging, tapping, long pressing, and double
    tapping
  * you can drag into and out of decks, which takes/puts cards from
    the top of the deck
      * hold shift while dragging into a deck to put a card on the bottom
  * long press on a deck to open a listing, where you can search,
    rearrange, and tap to add to playfield

## Libraries

  * The backend uses PhantomJS for rendering decks
  * The playfield uses interact.js

## To do:

There are a lot of things still to be done here, including:

  * Making it look prettier
  * finishing the editor
  * adding a context menu to the playfield
  * adding some sort of tutorial or help to the playfield
