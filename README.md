# E-Reader

EPUB reader written in vanilla JavaScript.
Aims to be a convenient and customizable way to view .epub files
you have on your PC or mobile device.
Uses [epub.js](https://github.com/futurepress/epub.js/).

# DEVELOPING

- Install [Node.js](https://nodejs.org/en/)
- Clone this repository
- Run `npm install --dev`
- Run `npm test`

# TODO

- [ ] Implement `Cypress` for end-to-end testing
- [ ] Implement epub reader
  - [x] Use [epub.js](https://github.com/futurepress/epub.js/)
- [ ] Implement epub file uploads
  - [ ] **Check for specifically epub files with proper format**
  - [ ] Drag-and-drop
  - [x] Upload button (HTML)
  - [ ] Grab from a direct link to an epub file
    - May not be possible? Needs further research.
- [x] Get book metadata
- [ ] Store list of previously opened books
  - [ ] Use local storage

# Tests

This project uses [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/).
Load the page `tests/tests.html` with `live-server` to test.

Write tests in `tests/tests.js`.

# Credits

https://github.com/github/gitignore/blob/main/Node.gitignore - The .gitignore
