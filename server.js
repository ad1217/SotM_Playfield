// jshint node:true
// jshint esversion:6
"use strict";

const http  = require('http'),
      fs    = require('fs'),
      path  = require('path'),
      url   = require('url'),
      phantom = require('phantom'),
      port  = 8080;

const decks = ["the_Unholy_Priest_update_2", "NZoths_Invasion_1.2", "Puffer_Fish_input_1.3"];

const server = http.createServer((req, res) => {
  const uri = url.parse(req.url);

  let pathParts = uri.pathname.split("/");
  switch (pathParts[1]) {
  case '':
  case 'index.html':
    sendIndex(res);
    break;
  case 'css':
    switch (pathParts[2]) {
    case 'playfield.css':
    case 'editor.css':
    case 'common.css':
      sendFile(res, path.join('css', pathParts[2]), 'text/css');
      break;
    default:
      send404(res, uri);
    }
    break;
  case 'js':
    switch (pathParts[2]) {
    case 'playfield.js':
    case 'editor.js':
    case 'interact.js':
      sendFile(res, path.join('js', pathParts[2]), 'application/javascript');
      break;
    default:
      send404(res, uri);
    }
    break;
  case 'template':
    pathParts.splice(0, 2); // remove first two elements
    let item = pathParts.join("/");
    console.log("template/" + item);
    switch (item) {
    case "card.json":
    case "deck.json":
    case "environment/input.json":
    case "hero/input.json":
    case "villain/input.json":
      sendFile(res, path.join("template", item), 'application/json');
      break;
    case "environment/deck.svg":
    case "hero/deck.svg":
    case "hero/character-back.svg":
    case "hero/character.svg":
    case "villain/deck.svg":
    case "villain/character.svg":
    case "villain/instructions.svg":
      sendFile(res, path.join("template", item), 'image/svg+xml');
      break;
    default:
      send404(res, uri);
    }
    break;
  case 'deck':
    if (pathParts.length < 3 || pathParts[2] === '') {
      sendIndex(res);
      break;
    }
    let deckName = decodeURI(pathParts[2]);
    switch (pathParts[3] || '') {
    case '':
      sendDeckIndex(res, deckName);
      break;
    case 'play':
      sendFile(res, 'html/playfield.html');
      break;
    case 'editor':
      sendFile(res, 'html/editor.html');
      break;
    case 'deck.png':
      sendFile(res, `decks/${deckName}.png`, 'image/png');
      break;
    case 'deck.json':
      sendFileJSON(res, deckName);
      break;
    case 'deck.tts.json':
      sendFile(res, `decks/${deckName}.json`, 'application/json');
      break;
    case 'deck.input.json':
      sendFile(res, `decks/${deckName}.input.json`, 'application/json');
      break;
    case 'upload':
      handleUpload(res, req);
      break;
    default:
      send404(res, uri);
    }
    break;
  default:
    send404(res, uri);
  }
});

server.listen(process.env.PORT || port);
console.log('listening on 8080');

function sendIndex(res) {
  const html = `
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/common.css">
        <title>Index</title>
      </head>
      <body>
        <label>Create New Deck: <input type="text" onchange="window.location='/deck/' + event.target.value + '/editor'"></label>
        <ul>
          ${(decks.map(d => `<li><a href="/deck/${d}">${d}</a></li>`).join(' '))}
        </ul>
      </body>
    </html>`;
  res.writeHead(200, {'Content-type': 'text/html; charset=utf-8'});
  res.end(html, 'utf-8');
}

function sendDeckIndex(res, deckName) {
    const html = `
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/common.css">
        <title>${deckName}</title>
      </head>
      <body>
        <ul>
          <li><a href="${deckName}/play">Play!</a></li>
          <li><a href="${deckName}/editor">Editor</a></li>
        </ul>
      </body>
    </html>`;
  res.writeHead(200, {'Content-type': 'text/html; charset=utf-8'});
  res.end(html, 'utf-8');
}

function sendFileJSON(res, deckName) {
  fs.readFile(`decks/${deckName}.json`, (error, content) => {
    console.log(JSON.parse(content));
    res.writeHead(200, {'Content-type': 'application/json; charset=utf-8'});
    res.end(JSON.stringify(JSON.parse(content).ObjectStates[0]), 'utf-8');
    if (error) {
      console.error(error);
    }
  });
}

function handleUpload(res, req) {
  let body = '';

  req.on('data', data => {
    body += data;
    // check for file > 100MB
    if (body.length > 1e8) {
      req.connection.destroy();
      console.log('upload too big');
    }
  });

  req.on('end', () => {
    const json = JSON.parse(body);
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
  });
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

function sendFile(res, filename, contentType='text/html; charset=utf-8') {
  fs.readFile(filename, (error, content) => {
    res.writeHead(200, {'Content-type': contentType});
    res.end(content, 'utf-8');
    if (error) {
      console.error(error);
    }
  });
}
