// Boilerplate for express.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Used for res.sendFile in app.get
const path = require('path');

// The node modules used in the app
// Some module dist files have a different name,
// so we use an associative array to denote this
const moduleDists = {'jszip': 'jszip', 'epubjs': 'epub', 'localforage': 'localforage'};
// As above, but the files are in a src folder
const moduleSrc = {'toastify-js': 'toastify'};
// const cssSrc = {'toastify-js': 'toastify-js/src/toastify.css'}

// Serving the node module scripts
// This is an abstracted way of serving all the needed scripts
// thanks to using moduleDists
Object.keys(moduleDists).forEach(key => {
  app.get(`/scripts/${moduleDists[key]}.min.js`, function(req, res) {
    res.sendFile(path.join(__dirname, `/node_modules/${key}/dist/${moduleDists[key]}.min.js`));
  });
});

for (module in moduleSrc) {
  console.log(moduleSrc[module]);
  app.get(`/scripts/${moduleSrc[module]}.js`, function (req, res) {
    res.sendFile(path.join(__dirname, `/node_modules/${module}/src/${moduleSrc[module]}.js`));
  });
}

// Serving the js
app.use('/js', express.static(path.join(__dirname, '/src/')));

// Serving the css
app.use('/css',express.static(path.join(__dirname, '/src/css/')));
// Also serving this css file
app.get('/css/toastify.css', function(req, res) {
  res.sendFile(path.join(__dirname, '/node_modules/toastify-js/src/toastify.css'));
});

// Serving the main file, index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './src/index.html'));
});

app.get('/reader', (req, res) => {
  res.sendFile(path.join(__dirname, './src/reader.html'));
});


// Redirects other URLs back to the index
app.get('/*', (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});
