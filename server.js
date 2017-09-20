// jshint node:true
// jshint esversion:6
"use strict";

const http  = require('http'),
      fs    = require('fs'),
      url   = require('url'),
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
  case 'script.js':
    sendFile(res, 'script.js', 'application/javascript');
    break;
  case 'interact.js':
    sendFile(res, 'interact.js', 'application/javascript');
    break;
  case 'deck':
    if (pathParts.length === 3) {
      let deckName = pathParts[2];
      sendDeckIndex(res, deckName);
    }
    else if (pathParts.length === 4) {
      let deckName = pathParts[2];
      switch (pathParts[3]) {
      case 'play':
        sendPlayfield(res, deckName);
        break;
      case 'deck.png':
        sendFile(res, deckName + '.png', 'image/png');
        break;
      case 'deck.json':
        sendFile(res, deckName + '.json', 'application/json');
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
    const html = `
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/style.css">
      </head>
      <body>
        <ul>
          <li><a href="deck/the_Unholy_Priest_update_2">the_Unholy_Priest_update_2</a></li>
        </ul>
      </body>
    </html>`;
  res.writeHead(200, {'contentType': 'text/html; charset=utf-8'});
  res.end(html, 'utf-8');
}

function sendDeckIndex(res, deckName) {
    const html = `
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/style.css">
      </head>
      <body>
        <a href="${deckName}/play">Play!</a>
      </body>
    </html>`;
  res.writeHead(200, {'contentType': 'text/html; charset=utf-8'});
  res.end(html, 'utf-8');
}

function sendPlayfield(res, deckName) {
  const html = `
    <html>
      <head>
        <script src="/interact.js"></script>
        <script src="/script.js"></script>
        <link rel="stylesheet" type="text/css" href="/style.css">
      </head>
      <body>
        <div id="card-container" data-deckName="${deckName}">
          <div class="card-pile deck" data-pile="deck">DECK</div>
          <div class="card-pile discard" data-pile="discard"></div>
          <div id="hand"></div>
        </div>
      </body>
    </html>`;
  res.writeHead(200, {'contentType': 'text/html; charset=utf-8'});
  res.end(html, 'utf-8');
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
