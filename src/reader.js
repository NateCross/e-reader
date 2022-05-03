import State from './State.js';
const AppState = new State();

/// HTML Elements ///
const $title = document.querySelector('#title');
const $toc = document.querySelector('#table-of-contents');
const $viewer = document.querySelector('#viewer');

const $prev = document.querySelector('#prev');
const $next = document.querySelector('#next');

// const $page_count = document.querySelector('.page-count');
const $page_current = document.querySelector('#current-page');
const $page_total = document.querySelector('#total-pages');
const $page_percent = document.querySelector('#percentage');

// TODO: Add buttons for other features

///// MAIN /////
(async () => {
  const Library = await localforage.getItem('Library');
  const openedBook = await localforage.getItem('OpenedBookLibIndex');

  // NOTE: This is still here for testing purposes.
  // TODO: Refactor stuff in the html to the js
  openBook(Library[openedBook].bookData);

  await AppState.openBook(Library[openedBook].bookData);

  // Update the page title
  document.title = `E-Reader: ${AppState.metadata.title}`;

})();

console.log('Loaded reader');
