// jshint node:true
// jshint esversion:6
"use strict";

const express = require('express'),
      Bundler = require('parcel-bundler'),
      fs      = require('fs'),
      path    = require('path'),
      phantom = require('phantom'),
      port    = process.env.PORT || 1234;

const decks = ["the_Unholy_Priest_update_2",
               "NZoths_Invasion_1.2",
               "Puffer_Fish_input_1.3"];

const app = express();
app.use(express.json());

app.use('/template', express.static('template'));
app.use('/decks', express.static('decks'));
app.get('/decks.json', (req, res) => res.json(decks));
app.post('/upload', handleUpload);

let bundler = new Bundler(path.join(__dirname, 'index.html'));
app.use(bundler.middleware());

app.listen(port, () => console.log(`App listening on port ${port}!`));

function handleUpload(req, res) {
  const json = request.body;
  const deckJSON = json.json;
  const cardTemplate = fs.readFileSync('template/card.json');
  const template = JSON.parse(fs.readFileSync(`template/${deckJSON.type}/input.json`));
  const cardCount = Object.entries(template.cardTypes)
        .map(ct => deckJSON[ct[0]].length * (ct[1].back ? 2 : 1))
        .reduce((sum, current) => sum + current, 0);

  let deckOut = JSON.parse(fs.readFileSync('template/deck.json'));
  deckOut.ObjectStates[0].Nickname = deckJSON.name;

  Object.assign(deckOut.ObjectStates[0].CustomDeck['1'],
                {NumWidth: Math.ceil(Math.sqrt(cardCount)),
                 NumHeight: Math.ceil(Math.sqrt(cardCount)),
                 FaceURL: `http://${req.headers.host}/deck/${deckJSON.name}/deck.png`,
                 BackURL: "http://cloud-3.steamusercontent.com/ugc/156906385556221451/CE2C3AFE1759790CB0B532FFD636D05A99EC91F4/"});

  let index = 100;
  deckOut.ObjectStates[0].ContainedObjects =
    Object.entries(template.cardTypes).map(
      cardType => deckJSON[cardType[0]].map(cardIn => {
        let cardOut = JSON.parse(cardTemplate);
        Object.assign(cardOut, {Nickname: cardIn.name,
                                Description: cardIn.keywords,
                                CardID: index});

        for (let ii=0; ii<(cardIn.count || 1); ii++) {
          deckOut.ObjectStates[0].DeckIDs.push(index);
        }
        index++;

        if(cardType[1].back) {
          let cardBack = JSON.parse(cardTemplate);
          Object.assign(cardBack, {Nickname: cardIn.back.name,
                                   Description: cardIn.back.keywords,
                                   CardID: index});
          cardOut.States = {"2": cardBack};
          index++;
        }
        return cardOut;
      }))
    .reduce((sum, cur) => sum.concat(cur), []);

  fs.writeFileSync(`decks/${deckJSON.name}.json`, JSON.stringify(deckOut));
  fs.writeFileSync(`decks/${deckJSON.name}.input.json`, JSON.stringify(deckJSON));

  console.log("making page");
  phantom.create().then(
    ph => ph.createPage().then(
      page => {
        page.on('onLoadFinished', status => {
          if (status !== 'success') {
            console.log('Failed to load page');
            ph.exit(1);
          }
          else {
            page.render(`decks/${deckJSON.name}.png`);
            page.close().then(() => ph.exit());
          }
        });
        page.property('zoomFactor', 2); // pretty arbitrary
        page.property('content', '<body style="margin:0;">' + json.body + '</body>');
      }));
  decks.push(deckJSON.name);
}

function send404(res, uri) {
  res.writeHead(404, {'Content-type': "text/html; charset=utf-8"});
  const html = `
    <head>
      <title>404 Not Found</title>
      <link rel="stylesheet" href="/css/common.css">
    </head>
    <body>
      <h1>Error 404: Path ${uri.pathname} not found</h1>
      You seem to have gone to the wrong place, would you like to go
      back to the <a href="/">main page</a>?
    </body>`;
  res.end(html, 'utf-8');
}
