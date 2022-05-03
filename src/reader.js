import State from './State.js';

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

// NOTE: These events must be made outside of the class since
// the event cannot access 'this.' from within the class

const AppState = new State(
  $page_current,
  $page_total,
  $page_percent,
  $title,
  $toc,
  $viewer,
  $prev,
  $next,
);

$page_current.onchange = e => {
  AppState.rendition.display(
    AppState.book.locations.cfiFromLocation(e.target.value)
  );
};

///// MAIN /////
(async () => {

  // Library is in localforage -- or indexedDB -- because it
  // can store objects. The opened book index is stored in
  // localStorage since it is just a simple number
  const Library = await localforage.getItem('Library');
  const openedBook = localStorage.getItem('OpenedBookLibIndex');

  // If we cannot find a book to open, go back to the index
  // TODO: Throw proper error message then go back
  if (!openedBook || !Library || !Library[openedBook])
    window.location.href = '/';

  // NOTE: This is still here for testing purposes.
  // TODO: Refactor stuff in the html to the js
  // openBook(Library[openedBook].bookData);

  await AppState.openBook(Library[openedBook].bookData);
  await AppState.renderBook()

  AppState.updateBookTitle();
  AppState.getStoredLocations();
  AppState.updateStoredLocations();
  AppState.loadTableOfContents();
  AppState.renderSavedLocation();

  // Update the page title
  document.title = `E-Reader: ${AppState.metadata.title}`;
})();

console.log(AppState);
console.log('Loaded reader');
