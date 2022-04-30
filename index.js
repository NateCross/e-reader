// Boilerplate for express.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Used for res.sendFile in app.get
const path = require('path');

// Serving the node module scripts
app.use('/scripts', express.static('./node_modules/jszip/dist/'));
app.use('/scripts', express.static('./node_modules/epubjs/dist/'));
app.use('/scripts', express.static('./node_modules/localforage/dist/'));

// Serving the css
app.use('/css',express.static('.src/css/'));

// Serving the main file, index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './index.html'));
});

// Redirects other URLs back to the index
app.get('/*', (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});
