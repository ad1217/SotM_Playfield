let deckJSON;
window.addEventListener("load", () => {
  let xhr = new XMLHttpRequest();
  xhr.addEventListener("load", () => {
    let respSVG = xhr.responseXML.children[0];

    document.querySelector('#jsonUpload').addEventListener('change', event => {
      let files = event.target.files;
      let reader = new FileReader();
      reader.onload = e => {
        deckJSON = JSON.parse(e.target.result);

        let deck = document.querySelector('#deck');
		deck.style.width = Math.ceil(Math.sqrt(deckJSON.deck.length)) *
          parseInt(respSVG.getAttribute("width")) + "pt";
		deck.style.height = Math.ceil(Math.sqrt(deckJSON.deck.length)) *
		  parseInt(respSVG.getAttribute("height")) + "pt";

        deck.innerHTML = "";

        deckJSON.deck.forEach((card, index) => {
          let cardSVG = respSVG.cloneNode(true);
          deck.appendChild(cardSVG);
          for (let prop in card) {
            if (prop !== "count") {
              wrapSVGText(cardSVG.querySelector('#' + prop),
                          String(card[prop]));
            }
          }
        });

        let data = (new XMLSerializer()).serializeToString(deck);
        let xhr = new XMLHttpRequest();
        xhr.open('POST', "upload");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({body: data, json: deckJSON}));
      };
      reader.readAsText(files[0]);
    });
  });
  xhr.open("GET", "/template/environment/card.svg");
  xhr.send();
});

function wrapSVGText(e, string) {
  // TODO: bold or italic text
  e.innerHTML = ""; // clear element
  let tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
  e.appendChild(tspan);
  let words = string.split(" ");
  let line = [];
  while(words.length > 0) {
	let word = words.shift();
    line.push(word);
	tspan.innerHTML = line.join(" ");
	// horizontal overflow
	// TODO: actually use units (also applies to vertical)
	if (word === "\n" ||
        (parseFloat(e.getAttribute("width")) &&
		 tspan.getComputedTextLength() > parseFloat(e.getAttribute("width")))) {
	  // if we have height, we can line wrap
	  if (parseFloat(e.getAttribute("height")) &&
		  e.children.length * parseFloat(e.getAttribute('font-size')) <
		  parseFloat(e.getAttribute('height'))) {
		words.unshift(line.pop());
		tspan.innerHTML = line.join(" ");
		line = [];

		tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
		tspan.setAttribute('x', e.getAttribute('x'));
		tspan.setAttribute('dy', e.getAttribute('font-size'));
		e.appendChild(tspan);
	  }
	  // vertical overflow or horizontal overflow with no height variable
	  // TODO: better with recursion instead?
	  else {
		line = [];
		e.innerHTML = ""; // remove all tspans
		tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
		e.appendChild(tspan);
		// TODO: maybe binary search font size later if I really care
		e.setAttribute('font-size', parseFloat(e.getAttribute('font-size')) * 0.9);
		words = string.split(" ");
		console.log("resetting, size= " + e.getAttribute('font-size'));
	  }
	}
  }
}
