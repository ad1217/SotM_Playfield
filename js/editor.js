//jshint browser:true
//jshint esversion:6
//jshint latedef:nofunc

let deckJSON, template;
let selected;
let deckName = window.location.pathname.split('/')[2];

document.title = "Editor|" + deckName;

window.addEventListener("load", () => {
  // load deck input json
  fetch("deck.input.json")
    .then(data => data.json())
    .then(json => {
      deckJSON = json;
      makeSVGs(deckJSON);
    })
    .catch(error => console.error(error));

  // deck JSON uploader
  document.querySelector('#jsonUpload').addEventListener('change', event => {
    let files = event.target.files;
    let reader = new FileReader();
    reader.onload = event => {
      deckJSON = JSON.parse(event.target.result);
      makeSVGs(deckJSON);
    };
    reader.readAsText(files[0]);
  });

  // Upload on save button
  document.querySelector('#saveButton').addEventListener('click', upload);

  // download input JSON
  document.querySelector('#jsonInputDownload').addEventListener(
    'click',
    () => downloadFile('data:application/json;charset=utf-8,' +
                       encodeURIComponent(JSON.stringify(deckJSON)),
                       deckName + '.input.json'));

  // download input JSON
  document.querySelector('#outputDownload').addEventListener(
    'click',
    () => downloadFile('deck.json',
                       deckName + '.json'));


  // handle changes to deck editor
  document.querySelector('#deckForm').addEventListener('input', event => {
    let prop = event.target.id.substring(4).toLowerCase();
    deckJSON[prop] = event.target.value;
    if (prop === 'type') {
      makeSVGs(deckJSON);
    }
  });
  });

  // handle changes to card editor
  document.querySelector('#cardForm').addEventListener('input', event => {
    let prop = event.target.id.substring(5);
    if (prop !== "count") {
      wrapSVGText(selected.svg.querySelector('#' + prop),
                  String(event.target.value));
    }
    if (event.target.value) {
      selected.json[prop] = event.target.value;
    }
    else {
      delete selected.json[prop];
    }
  });

  // chrome doesn't seem to send input event on file select
  document.querySelector('#cardForm').addEventListener('change', event => {
    let prop = event.target.id.substring(5);
    if (prop === "image") {
      let files = event.target.files;
      let reader = new FileReader();
      reader.onload = e => {
        selected.svg.querySelector('#' + prop)
          .setAttributeNS("http://www.w3.org/1999/xlink", "href", e.target.result);
        selected.json[prop] = e.target.result;
      };
      reader.readAsDataURL(files[0]);
    }
  });

  window.addEventListener('beforeunload',
                          e => e.returnValue = "Unsaved changes blah blah");
});

function downloadFile(file, name) {
  let dl = document.createElement('a');
  dl.setAttribute('href', file);
  dl.setAttribute('download', name);
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
}

function getSVGTemplate(name, callback) {
  return fetch("/template/" + name + ".svg")
    .then(response => response.text())
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml").activeElement);
}

async function makeSVGs(deckJSON) {
  document.querySelector('#deckName').value = deckJSON.name || "";
  document.querySelector('#deckType').value = deckJSON.type || "";

  let deck = document.querySelector('#deck');
  deck.innerHTML = "";

  let template = await fetch(`/template/${deckJSON.type}/input.json`)
      .then(data => data.json());

  let cardCount = Object.entries(template.cardTypes)
      .map(ct => deckJSON[ct[0]].length * (ct[1].back ? 2 : 1))
      .reduce((sum, current) => sum + current, 0);

  // note: needs to be a for loop because it needs to be synchronous
  // and also have await
  // Although I suppose I could prefetch the SVGs and then do the rest...
  for (let cardType of Object.entries(template.cardTypes)) {
    let backSVG;
    if (cardType[1].back) {
      let backTemplate = cardType[1].back.template || (cardType[0] + "-back");
      backSVG = await getSVGTemplate(deckJSON.type + "/" + backTemplate);
    }
    let templateSVG = await getSVGTemplate(deckJSON.type + "/" + cardType[0]);
    console.log(templateSVG);

    // build card SVGs
    deckJSON[cardType[0]].forEach(card => {
      makeCardSVG(deck, cardType[1], templateSVG, card);

      // if there is a back, build it too
      if (cardType[1].back) {
        makeCardSVG(deck, cardType[1].back, backSVG, card, back=true);
      }
    });

    // set div width/height based on number of cards
    deck.style.width = Math.ceil(Math.sqrt(cardCount)) *
      parseInt(templateSVG.getAttribute("width")) + "pt";
    deck.style.height = Math.ceil(Math.sqrt(cardCount)) *
	  parseInt(templateSVG.getAttribute("height")) + "pt";
  };
}

function setForm(cardTemplate, card) {
  let form = document.querySelector('#cardForm');
  form.innerHTML = "";

  Object.entries(cardTemplate.inputs).forEach(prop => {
    let div = form.appendChild(document.createElement('div'));
    let label = div.appendChild(document.createElement('label'));
    label.textContent = prop[0];

    let input = label.appendChild(
      document.createElement(prop[1] === 'textarea' ? 'textarea' : 'input'));
    input.id = "card-" + prop[0];

    if (prop[1] === "image") {
      input.type = "file";
    }
    else {
      input.type = prop[1];
      input.value = card[prop[0]] || "";
    }
  });
}

function makeCardSVG(deck, cardInputTemplate, templateSVG, card, back=false) {
  let propSource = (back && card.back) ? card.back : card;
  let cardSVG = deck.appendChild(templateSVG.cloneNode(true));
  cardSVG.addEventListener('click', () => {
    selected = {svg: cardSVG, json: card};
    setForm(cardInputTemplate, card);
  }, true);
  Object.keys(cardInputTemplate.inputs).forEach(prop => {
    let inputProp = propSource[prop] || card[prop] || "";
    wrapSVGText(cardSVG.querySelector('#' + prop), String(inputProp));
  });
  Object.entries(cardInputTemplate.hide || []).forEach(hidable => {
    cardSVG.querySelector('#' + hidable[0])
      .setAttribute('display', hidable[1] in propSource ? '' : 'none');
  });
}

function upload() {
  let deck = document.querySelector('#deck');

  // POST the generated SVGs to the server
  let data = (new XMLSerializer()).serializeToString(deck);
  fetch('upload', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({body: data, json: deckJSON})
  });
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
