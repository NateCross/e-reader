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

const AppState = new State();

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

  // Performing initialization operations
  await AppState.openBook(Library[openedBook].bookData);
  AppState.renderBook($viewer);
  AppState.updateBookTitle($title);
  AppState.getStoredLocations($page_total);
  AppState.loadTableOfContents($toc);

  attachKeyboardInput();
  attachClickButtonInput();

  AppState.attachRelocatedEvent($page_current, $page_percent, $toc);
  $page_current.onchange = e => {
    AppState.rendition.display(
      AppState.book.locations.cfiFromLocation(e.target.value)
    );
  };

  // Update the page title
  // Must be done after book is loaded
  document.title = `E-Reader: ${AppState.metadata.title}`;
})();

console.log(AppState);
console.log('Loaded reader');

/**
 * Helper function used in attachKeyboardInput.
 * Requires AppState to be initialized.
 * @param {Event} e
 */
function keyListener(e) {
  switch (e.key) {
    case "ArrowLeft":
      AppState.prevPage();
      break;
    case "ArrowRight":
      AppState.nextPage();
      break;
  }
}

/**
 * Execute function to enable keyboard input.
 * Must be called after book is rendered in a rendition.
 * @param {State} State The AppState object
 */
function attachKeyboardInput() {
  // Allows for keyboard input with left and right arrow
  // Both must be called here, else, it would not work
  // NOTE: For some reason, the AppState.rendition.on line
  // only works if you render the book with the
  // 'allowScriptedContent' option set to true
  AppState.rendition.on('keydown', keyListener);
  document.addEventListener('keydown', keyListener, false);
}

function attachClickButtonInput() {
  $next.addEventListener("click", () => AppState.nextPage(), false);
  $prev.addEventListener("click", () => AppState.prevPage(), false);
}
