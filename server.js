// jshint node:true
// jshint esversion:6
"use strict";

const http  = require('http'),
      qs    = require('querystring'),
      fs    = require('fs'),
      url   = require('url'),
      https = require('https'),
      port  = 8080;

const deckName = "the_Unholy_Priest_update_2";

const server = http.createServer((req, res) => {
  const uri = url.parse(req.url);

  if (req.method === 'POST') {
    handlePost(res, req, uri);
  }
  else {
    switch( uri.pathname ) {
    case '/':
    case '/index.html':
      sendIndex(res, "");
      break;
    case '/style.css':
      sendFile(res, 'style.css', 'text/css');
      break;
    case '/script.js':
      sendFile(res, 'script.js', 'application/javascript');
      break;
    case '/interact.js':
      sendFile(res, 'interact.js', 'application/javascript');
      break;
    case '/' + deckName + '.png':
      sendFile(res, deckName + '.png', 'image/png');
      break;
    case '/' + deckName + '.json':
      sendFile(res, deckName + '.json', 'application/json');
      break;
    default:
      res.writeHead(404, {'Content-type': "text/html; charset=utf-8"});
      const html = `
      <head>
        <title>404 Not Found</title>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <h1>Error 404: Path ${uri.pathname} not found</h1>
        You seem to have gone to the wrong place, would you like to go
        back to the <a href="/">main page</a>?
      </body>`;
      res.end(html, 'utf-8');
    }
  }

});

server.listen(process.env.PORT || port);
console.log('listening on 8080');

function sendIndex(res) {
  let cards = [];
  const html = `
    <html>
      <head>
        <script src="interact.js"></script>
        <script src="script.js"></script>
        <link rel="stylesheet" type="text/css" href="style.css">
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

function sendFile(res, filename, contentType='text/html; charset=utf-8') {
  fs.readFile(filename, (error, content) => {
    res.writeHead(200, {'Content-type': contentType});
    res.end(content, 'utf-8');
    if (error) {
      console.error(error);
    }
  });
}
