--- 
title: Card Game Playfield and Generator
members: Adam Goldsmith
--- 

My proposed project is a card game deck generator/virtual tabletop, designed for use as apart of physical game.

## Summary
  * Deck Generator
      * creates decks from JSON descriptions
      * at least support for Sentinels of the Multiverse decks, maybe others
          * ideally, the code should be generic enough that others are easy to add
      * output for Tabletop Simulator, Playfield, and maybe printing
      * current progress: previously implemented in Python, but with major issues
  * Playfield
      * 2D field to move cards around
      * includes hand, decks, and discard
      * targeting touch interface, maybe mobile
      * using [interact.js](http://interactjs.io/)
      * should support any Tabletop Simulator deck
      * possibly including helper objects like HP trackers
      * possibly including multi-client support
          * could just be convenience for one player, or several players for a full game
      * current progress: wrote a prototype in this last week, works reasonably well
  * Deck Editor
      * GUI for creating/editing decks
      * decks usable in generator/playfield
      * should allow export of data in some useful format(s)
      * maybe users/permissions, which might require a database
      * current progress: none

## Detail
### Deck Generator (server side)
I have previously been working on a deck generator, primarily for a game called Sentinels of the Multiverse, written in Python. This has some severe limitations, especially due to the fact that I cannot directly access the DOM of the SVG card templates I have created, since I am rendering them externally with Inkscape. This means that things like text wrapping and dynamically sized boxes are rather difficult, and should be easier in Javascript. Having already worked on this part means that my card templates are already reasonably prepared (the hard part, really), and I have some example decks to work with. Ideally, this would be able to generate decks for use in the Playfield (see below), Tabletop Simulator, and possibly for physical printing.

### Playfield (dynamic client-side)
Currently, the decks are tested using a 3D game/engine called Tabletop Simulator. While this is convenient in some ways (it can be played over the Internet, for example), it is somewhat more annoying to play than with physical cards. Therefore, this part of the project attempts to blend them together by creating a 2D virtual "playfield" in which the cards can be manipulated similarly to in real life. A possible (time-dependent) addition to this would be the ability for multiple client to connect to the same session, with one showing the hand and one showing the table, or even several people for a full virtual game.

### Deck Editor (both?)
Another thing that would be nice is the creation of an online deck editor, which would allow more detailed tweaking as well as more easy entry of cards. Currently, card descriptions are in a JSON format, which is somewhat difficult for average people to use. This would present a friendly GUI, with relatively easy to use controls.
