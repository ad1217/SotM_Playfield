//jshint browser:true
//jshint esversion:6
//jshint latedef:nofunc

let deckJSON, template;
let selected;
let deckName = window.location.pathname.split('/')[2];

document.title = "Editor|" + deckName;

window.addEventListener("load", () => {
  // load deck input json
  getJSON("deck.input.json", json => {
    deckJSON = json;
    makeSVGs(deckJSON);
  });

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
  });

  // handle changes to card editor
  document.querySelector('#cardForm').addEventListener('input', event => {
    let deck = document.querySelector('#deck');
    let prop = event.target.id.substring(5);
    if (prop === "image") {
      let files = event.target.files;
      let reader = new FileReader();
      reader.onload = e => {
        selected.svg.querySelector('#' + prop).setAttribute("href", e.target.result);
      };
      reader.readAsDataURL(files[0]);
    }
    else if (prop !== "count") {
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
});

function downloadFile(file, name) {
  let dl = document.createElement('a');
  dl.setAttribute('href', file);
  dl.setAttribute('download', name);
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
}

function getJSON(filename, callback) {
  let xhr = new XMLHttpRequest();
  xhr.addEventListener("load", () => {
    if (xhr.status === 200) {
      callback(JSON.parse(xhr.responseText));
    }
  });
  xhr.open("GET", filename);
  xhr.send();
}

function getSVGTemplate(name, callback) {
  let xhr = new XMLHttpRequest();
  xhr.addEventListener("load", () => {
    let respSVG = xhr.responseXML.children[0];
    callback(respSVG);
  });
  xhr.open("GET", "/template/" + name + ".svg");
  xhr.send();
}

function makeSVGs(deckJSON) {
  document.querySelector('#deckName').value = deckJSON.name || "";
  document.querySelector('#deckType').value = deckJSON.type || "";

  let deck = document.querySelector('#deck');
  deck.innerHTML = "";

  setDeckTemplate(deckJSON.type, () => {
    Object.entries(template.cardTypes).forEach(cardType => {
      getSVGTemplate(deckJSON.type + "/" + cardType[0], templateSVG => {
        deck.style.width = Math.ceil(Math.sqrt(deckJSON.deck.length)) *
          parseInt(templateSVG.getAttribute("width")) + "pt";
        deck.style.height = Math.ceil(Math.sqrt(deckJSON.deck.length)) *
	      parseInt(templateSVG.getAttribute("height")) + "pt";

        // build card SVGs
        deckJSON[cardType[0]].forEach(
          card => makeCardSVG(deck, cardType[1], templateSVG, card));
      });
    });
  });
}

function setDeckTemplate(type, callback) {
  getJSON("/template/" + type + "/input.json", json => {
    template = json;
    callback();
  });
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

function makeCardSVG(deck, cardInputTemplate, templateSVG, card) {
  let cardSVG = deck.appendChild(templateSVG.cloneNode(true));
  cardSVG.addEventListener('click', () => {
    selected = {svg: cardSVG, json: card};
    setForm(cardInputTemplate, card);
  }, true);
  Object.keys(cardInputTemplate.inputs).forEach(
    prop => wrapSVGText(cardSVG.querySelector('#' + prop), String(card[prop] || "")));
  Object.entries(cardInputTemplate.hide).forEach(hidable => {
    if (hidable[1] in card) {
      cardSVG.querySelector('#' + hidable[0]).setAttribute('display', '');
    }
    else {
      cardSVG.querySelector('#' + hidable[0]).setAttribute('display', 'none');
    }
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
