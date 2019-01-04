// jshint node:true
// jshint esversion:6
"use strict";

const express   = require('express'),
      Bundler   = require('parcel-bundler'),
      fs        = require('fs'),
      path      = require('path'),
      phantom   = require('phantom'),
      Datastore = require('nedb-promises'),
      port      = process.env.PORT || 1234;


const db = Datastore.create('decks.db');

const app = express();
app.use(express.json({limit: '50mb'}));

app.use('/template', express.static('template'));
app.get('/decks/:deckID.tts.json', getTTSJSON);
app.get('/decks/:deckID.json', getInputJSON);
app.get('/decks/:deckID.png', getDeckImage);
app.get('/decks.json', getDecksList);
app.post('/upload', handleUpload);

let bundler = new Bundler(path.join(__dirname, 'index.html'));
app.use(bundler.middleware());

app.listen(port, () => console.log(`App listening on port ${port}!`));

function getDecksList(req, res) {
  db.find({}, {'deck.meta': 1})
    .then(docs => res.json(docs))
    .catch(err => res.status(404).end());
}

function getInputJSON(req, res) {
  db.findOne({_id: req.params.deckID})
    .then(doc => res.json(doc.input))
    .catch(err => res.status(404).end());
}

function getDeckImage(req, res) {
  db.findOne({_id: req.params.deckID})
    .then(doc => res.send(new Buffer.from(doc.image, 'base64')))
    .catch(err => res.status(404).end());
}

function getTTSJSON(req, res) {
  db.findOne({_id: req.params.deckID})
    .then(doc => {
      let deckIn = doc.deck;
      const cardTemplate = fs.readFileSync(__dirname + '/template/card.json');
      const template = JSON.parse(fs.readFileSync(__dirname + `/template/${deckIn.type}/input.json`));
      const cardCount = Object.entries(template.cardTypes)
            .map(ct => deckIn[ct[0]].length * (ct[1].back ? 2 : 1))
            .reduce((sum, current) => sum + current, 0);

      let deckOut = JSON.parse(fs.readFileSync(__dirname + '/template/deck.json'));
      deckOut.ObjectStates[0].Nickname = deckIn.meta.name;

      Object.assign(deckOut.ObjectStates[0].CustomDeck['1'],
                    {NumWidth: Math.ceil(Math.sqrt(cardCount)),
                     NumHeight: Math.ceil(cardCount/Math.ceil(Math.sqrt(cardCount))),
                     FaceURL: `http://${req.headers.host}/decks/${doc.meta.name}.png`,
                     BackURL: "http://cloud-3.steamusercontent.com/ugc/156906385556221451/CE2C3AFE1759790CB0B532FFD636D05A99EC91F4/"});

      let index = 100;
      deckOut.ObjectStates[0].ContainedObjects = Object
        .keys(deckIn)
        .filter(cardType => cardType !== 'meta')
        .map(cardType => deckIn[cardType].map((card, index) => {
          let cardOut = {...JSON.parse(cardTemplate),
                         Nickname: card.name,
                         Description: card.keywords,
                         CardID: index};

          deckOut.ObjectStates[0].DeckIDs.push(...Array(card.count || 1).fill(index));
          index++;

          if(card.back) {
            cardOut.States = {"2": {...JSON.parse(cardTemplate),
                                    Nickname: card.back.name,
                                    Description: card.back.keywords,
                                    CardID: index}};
            index++;
          }
          return cardOut;
        }))
        .reduce((sum, cur) => sum.concat(cur), []); // flatten

      res.json(deckOut);
    });
}

function handleUpload(req, res) {
  const json = req.body;

  console.log("Making deck image");
  phantom.create().then(ph => ph.createPage().then(
    page => {
      page.on('onLoadFinished', status => {
        if (status === 'success') {
          page.renderBase64(`PNG`).then(image => {
            db.update({_id: json.id},
                      {deck: json.deck, image: image},
                      {upsert: true, returnUpdatedDocs: true})
              .then(doc => res.status(201).json({id: doc._id}));
            page.close().then(() => ph.exit());
          });
        }
        else {
          console.log('Failed to load page');
          ph.exit(1);
        }
      });
      page.property('zoomFactor', 2); // pretty arbitrary
      page.property('content', '<body style="margin:0;">' + json.body + '</body>');
    }));
}
