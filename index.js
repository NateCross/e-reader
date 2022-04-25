// import * as express from 'express';
const express = require('express')
const app = express();
const port = process.env.PORT || 3000;

// Used for res.sendFile in app.get
const path = require('path');
// import * as path from 'path';

// app.use(express.static(__dirname + 'js'));
// app.use('/static', express.static(__dirname + 'js'));
// app.get('js/e-reader.js', (req, res) => {
//   res.sendFile(path.join(__dirname, 'e-reader.js'));
// });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './index.html'));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});