let deckJSON;
let selected = 0;
let deckName = window.location.pathname.split('/')[2];

document.title = "Editor|" + deckName;

window.addEventListener("load", () => {
  // deck JSON uploader
  document.querySelector('#jsonUpload').addEventListener('change', event => {
    let files = event.target.files;
    let reader = new FileReader();
    reader.onload = handleUpload;
    reader.readAsText(files[0]);
  });

  // download input JSON
  document.querySelector('#jsonInputDownload').addEventListener('click', () => {
    let dl = document.createElement('a');
    dl.setAttribute('href', 'data:application/json;charset=utf-8,' +
                    encodeURIComponent(JSON.stringify(deckJSON)));
    dl.setAttribute('download', deckName + '.input.json');
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  });

  // handle changes to deck editor
  document.querySelector('#deckForm').addEventListener('input', event => {
    let prop = event.target.id.substring(4).toLowerCase();
    deckJSON[prop] = event.target.value;
  });

  // handle changes to card editor
  document.querySelector('#cardForm').addEventListener('input', event => {
    let deck = document.querySelector('#deck');
    let prop = event.target.id.substring(4).toLowerCase();
    if (prop !== "count") {
      wrapSVGText(deck.children[selected].querySelector('#' + prop),
                  String(event.target.value));
    }
    if (event.target.value) {
      deckJSON.deck[selected][prop] = event.target.value;
    }
    else {
      delete deckJSON.deck[selected][prop];
    }
  });
});

function getSVGTemplate(name, callback) {
  let xhr = new XMLHttpRequest();
  xhr.addEventListener("load", () => {
    let respSVG = xhr.responseXML.children[0];
    callback(respSVG);
  });
  xhr.open("GET", "/template/" + name + ".svg");
  xhr.send();
}

function handleUpload(event) {
  deckJSON = JSON.parse(event.target.result);

  document.querySelector('#deckName').value = deckJSON.name || "";
  document.querySelector('#deckType').value = deckJSON.type || "";

  let deck = document.querySelector('#deck');

  getSVGTemplate("environment/card", templateSVG => {
    deck.style.width = Math.ceil(Math.sqrt(deckJSON.deck.length)) *
      parseInt(templateSVG.getAttribute("width")) + "pt";
    deck.style.height = Math.ceil(Math.sqrt(deckJSON.deck.length)) *
	  parseInt(templateSVG.getAttribute("height")) + "pt";

    deck.innerHTML = "";

    // build card SVGs
    deckJSON.deck.forEach((card, index) => {
      let cardSVG = templateSVG.cloneNode(true);
      cardSVG.addEventListener('click', event => {
        selected = index;
        document.querySelector('#cardName').value = card.name || "";
        document.querySelector('#cardKeywords').value = card.keywords || "";
        document.querySelector('#cardCount').value = card.count || 1;
        document.querySelector('#cardText').value = card.text || "";
      }, true);
      deck.appendChild(cardSVG);
      for (let prop in card) {
        if (prop !== "count") {
          wrapSVGText(cardSVG.querySelector('#' + prop), String(card[prop]));
        }
      }
    });
  });
}

function upload() {
  let deck = document.querySelector('#deck');

  // POST the generated SVGs to the server
  let data = (new XMLSerializer()).serializeToString(deck);
  let xhr = new XMLHttpRequest();
  xhr.open('POST', "upload");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({body: data, json: deckJSON}));
}

function wrapSVGText(e, string) {
  // TODO: bold or italic text
  e.innerHTML = ""; // clear element
  let lines = string.split("\n");
  if (e.getAttribute('default-font-size'))
    e.setAttribute('font-size', e.getAttribute('default-font-size'));
  e.setAttribute('default-font-size', e.getAttribute('font-size'));
  while (lines.length > 0) {
    let words = lines.shift().split(" ");
    let tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
	tspan.setAttribute('x', e.getAttribute('x'));
    if (e.innerHTML !== "") tspan.setAttribute('dy', e.getAttribute('font-size'));
    e.appendChild(tspan);
    let line = [];
    while(words.length > 0) {
	  let word = words.shift();
      if (word === "") word = " ";
      line.push(word);
	  tspan.innerHTML = line.join(" ");
	  // horizontal overflow
	  // TODO: actually use units (also applies to vertical)
	  if (parseFloat(e.getAttribute("width")) &&
		  tspan.getComputedTextLength() > parseFloat(e.getAttribute("width"))) {
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
		  e.innerHTML = ""; // remove all tspans
		  // TODO: maybe binary search font size later if I really care
		  e.setAttribute('font-size', parseFloat(e.getAttribute('font-size')) * 0.9);
		  words = [];
          lines = string.split('\n');
		  console.log("resetting, size= " + e.getAttribute('font-size'));
	    }
	  }
    }
  }
}
