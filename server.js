// jshint node:true
// jshint esversion:6
"use strict";

const http  = require('http'),
      fs    = require('fs'),
      path  = require('path'),
      url   = require('url'),
      phantom = require('phantom'),
      port  = 8080;

const server = http.createServer((req, res) => {
  const uri = url.parse(req.url);

  let pathParts = uri.pathname.split("/");
  switch (pathParts[1]) {
  case '':
  case 'index.html':
    sendIndex(res);
    break;
  case 'style.css':
    sendFile(res, 'style.css', 'text/css');
    break;
  case 'js':
    switch (pathParts[2]) {
    case 'playfield.js':
      sendFile(res, 'js/playfield.js', 'application/javascript');
      break;
    case 'editor.js':
      sendFile(res, 'js/editor.js', 'application/javascript');
      break;
    case 'interact.js':
      sendFile(res, 'interact.js', 'application/javascript');
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
      sendFile(res, "template/" + item, 'application/json');
      break;
    case "environment/card.svg":
    case "hero/card.svg":
    case "hero/charBack.svg":
    case "hero/charFront.svg":
    case "villain/card.svg":
    case "villain/character.svg":
    case "villain/instructions.svg":
      sendFile(res, "template/" + item, 'image/svg+xml');
      break;
    default:
      send404(res, uri);
    }
    break;
  case 'deck':
    if (pathParts.length === 3) {
      let deckName = decodeURI(pathParts[2]);
      sendDeckIndex(res, deckName);
    }
    else if (pathParts.length === 4) {
      let deckName = decodeURI(pathParts[2]);
      switch (pathParts[3]) {
      case 'play':
        sendFile(res, 'html/playfield.html');
        break;
      case 'editor':
        sendFile(res, 'html/editor.html');
        break;
      case 'deck.png':
        sendFile(res, deckName + '.png', 'image/png');
        break;
      case 'deck.json':
        sendFileJSON(res, deckName);
        break;
      case 'upload':
        handleUpload(res, req, deckName);
        break;
      default:
        send404(res, uri);
      }
    }
    break;
  default:
    send404(res, uri);
  }
});

server.listen(process.env.PORT || port);
console.log('listening on 8080');

function sendIndex(res) {
  let decks = ["the_Unholy_Priest_update_2", "NZoths_Invasion_1.1"];
  const html = `
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/style.css">
        <title>Index</title>
      </head>
      <body>
        <ul>
          ${(decks.map(d => `<li><a href="deck/${d}">${d}</a></li>`).join(' '))}
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
        <link rel="stylesheet" type="text/css" href="/style.css">
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
  fs.readFile(deckName + '.json', (error, content) => {
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
    let json = JSON.parse(body);

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
              page.render("dest.png");
              page.close().then(() => ph.exit());
            }
          });
          page.property('zoomFactor', 2); // pretty arbitrary
          page.property('content', json.body);
      }));
  });
}

function send404(res, uri) {
  res.writeHead(404, {'Content-type': "text/html; charset=utf-8"});
  const html = `
    <head>
      <title>404 Not Found</title>
      <link rel="stylesheet" href="/style.css">
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
