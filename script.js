let deckName, deckJSON, cardCount, deckWidth, deckHeight,
    piles = {'deck': [], discard: []};

window.addEventListener('load', () => {
  let xhr = new XMLHttpRequest();
  xhr.addEventListener("load", () => {
    deckJSON = JSON.parse(xhr.responseText);
    piles['deck'] = deckJSON.ObjectStates[0].DeckIDs.map(c => c - 100);
    cardCount = piles['deck'].length;
    shuffle(piles['deck']);
    deckWidth = deckJSON.ObjectStates[0].CustomDeck["1"].NumWidth;
    deckHeight = deckJSON.ObjectStates[0].CustomDeck["1"].NumHeight;
    console.log(deckName);
  });
  deckName = document.querySelector('#card-container').getAttribute("data-deckName");
  xhr.open("GET", "/deck/" + deckName + "/deck.json");
  xhr.send();
});

let cardInteract = interact('.card')
  .draggable({
    restrict: {
      restriction: "parent",
      endOnly: true,
      elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
    },

    snap: {
      targets: [() => {
        // TODO: maybe change to dropzone?
        let pos = document.body.getBoundingClientRect(),
            style = window.getComputedStyle(hand),
            handHeight = parseInt(style.getPropertyValue("height"));
        return {y: pos.bottom,
                range: handHeight/2};
      }],
      relativePoints: [{x: 0.5 , y: 1}]
    },

    onmove: dragMoveListener
  })
  .on('hold', event => {
    let target = event.target,
        transform = target.style.transform;
    // Scale up for visibility
    if (transform.includes("scale(2)")) {
      // translate the element
      target.style.webkitTransform =
        target.style.transform = transform.replace(" scale(2)", "");
    }
    else {
      target.style.webkitTransform =
        target.style.transform = transform + ' scale(2)';
    }
  });

interact('.card-pile')
  .dropzone({
    accept: '.card',
    ondrop: event => {
      let pileName = event.target.getAttribute('data-pile');
      piles[pileName].push(event.relatedTarget.getAttribute('data-num'));
      event.relatedTarget.parentElement.removeChild(event.relatedTarget);

      // update deck text
      event.target.innerHTML = `${pileName.toUpperCase()}<br>${piles[pileName].length}/${cardCount}`;
    }
  })
  .draggable({manualStart: true})
  .on('move', event => {
    let interaction = event.interaction;
    let pileName = event.target.getAttribute('data-pile');
    let pile = piles[pileName];

    // if the pointer was moved while being held down
    // and an interaction hasn't started yet
    if (interaction.pointerIsDown &&
        !interaction.interacting() &&
        pile.length > 0) {
      // draw a new card
      let newCard = document.createElement('div');
      newCard.className = "card";
      let style = window.getComputedStyle(newCard);
      let cardNum = pile.pop();
      newCard.setAttribute('data-num', cardNum);
      newCard.style.backgroundPosition = `
      ${(cardNum % deckWidth) * parseInt(style.getPropertyValue("width"))}px
      ${Math.floor(cardNum/deckHeight) * parseInt(style.getPropertyValue("height"))}px`;
	  newCard.style.backgroundImage = "url('deck.png')";
      newCard.style.backgroundSize = `${deckWidth * 100}% ${deckHeight * 100}%`;

      // insert the card to the page
      document.querySelector("#card-container").appendChild(newCard);

      // update deck text
      event.target.innerHTML = `${pileName.toUpperCase()}<br>${pile.length}/${cardCount}`;

      // start a drag interaction targeting the clone
      interaction.start({name: 'drag'}, cardInteract, newCard);
    }
  });

// Fisher-Yates shuffle from https://bost.ocks.org/mike/shuffle/
function shuffle(array) {
  let m = array.length, t, i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

function dragMoveListener (event) {
  let interaction = event.interaction;

  let target = event.target,
      // keep the dragged position in the data-x/data-y attributes
      x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
      y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

  // translate the element
  target.style.webkitTransform =
    target.style.transform =
    'translate(' + x + 'px, ' + y + 'px)';

  // raise to top
  target.parentElement.removeChild(target);
  document.querySelector("#card-container").appendChild(target);

  // update the posiion attributes
  target.setAttribute('data-x', x);
  target.setAttribute('data-y', y);
}

