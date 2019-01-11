// jshint node:true
// jshint esversion:6
"use strict";

const express   = require('express'),
      Bundler   = require('parcel-bundler'),
      fs        = require('fs'),
      path      = require('path'),
      Datastore = require('nedb-promises'),
      port      = process.env.PORT || 1234;


const db = Datastore.create('decks.db');

const app = express();
app.use(express.json({limit: '50mb'}));

app.use('/template', express.static('template'));
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
  db.findOne({_id: req.params.deckID}, {image: 0})
    .then(doc => res.json(doc))
    .catch(err => res.status(404).end());
}

function getDeckImage(req, res) {
  db.findOne({_id: req.params.deckID})
    .then(doc => res.send(new Buffer.from(doc.image, 'base64')))
    .catch(err => res.status(404).end());
}

function handleUpload(req, res) {
  const json = req.body;
  console.log("Got deck upload!");
  db.update({_id: json._id},
            {deck: json.deck,
             image: json.image.substr("data:image/png;base64,".length)},
            {upsert: true, returnUpdatedDocs: true})
    .then(doc => res.status(201).json({id: doc._id}));
}
