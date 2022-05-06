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

const $highlight = document.querySelector('#highlight');
const $highlight_remove_all = document.querySelector('#highlight-remove-all');
const $highlight_list = document.querySelector('#highlight-list');

const $bookmark = document.querySelector('#bookmark');
const $bookmark_remove_all = document.querySelector('#bookmark-remove-all');
const $bookmark_list = document.querySelector('#bookmark-list');

const $search_bar = document.querySelector('#search-bar');
const $search_results_current = document.querySelector('#results-current');
const $search_results_total = document.querySelector('#results-total');

const $voices = document.querySelector('#voices');
const $speech_start = document.querySelector('#speech-start');
const $speech_stop = document.querySelector('#speech-stop');

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
  await AppState.getStoredSettings();
  AppState.renderBook($viewer);
  AppState.updateBookTitle($title);
  AppState.getStoredLocations($page_total);
  AppState.loadTableOfContents($toc);
  AppState.getStoredHighlights($highlight_list);
  AppState.getStoredBookmarks($bookmark_list);
  AppState.initializeSpeech($voices);

  // TODO: Refactor to go inside AppState
  attachKeyboardInput();
  attachClickButtonInput();

  AppState.attachRelocatedEvent($page_current, $page_percent, $toc);

  $page_current.onchange = e => {
    if (!e.target.value) {
      $page_current.value = AppState.currentPageRange;
      return;
    }

    AppState.rendition.display(
      AppState.book.locations.cfiFromLocation(e.target.value)
    );
  };

  $highlight.onclick = highlightCurrentTextSelection;
  $highlight_remove_all.onclick = resetHighlights;
  $bookmark.onclick = bookmarkCurrentPage;
  $bookmark_remove_all.onclick = resetBookmarks;
  $search_bar.onchange = searchInBook;
  $search_results_current.onchange = jumpToSearchResult;
  $voices.onchange = changeVoice;
  $speech_start.onclick = startSpeech;
  $speech_stop.onclick = stopSpeech;
 

  AppState.attachContentsSelectionHook($viewer);

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

function highlightCurrentTextSelection(e) {

  // Hacky way to deselect the highlighted text
  // TODO: Find a cleaner way to do this
  // NOTE: Doesn't work on Firefox
  // e.view[0].getSelection().empty();

  if (!AppState.currentSelectionText || !AppState.currentSelectionCFI)
    throw 'Unable to highlight selected text.';

  AppState.rendition.annotations.highlight(
    AppState.currentSelectionCFI,
    {},
    e => {
      console.log(`Highlight Clicked: ${e.target}`);
      console.log(AppState.rendition.annotations._annotations);
    }
  );

  AppState.pushSelectionToHighlights($highlight_list);
}

function resetHighlights() {
  AppState.highlights.forEach(highlight => {
    AppState.rendition.annotations.remove(highlight, "highlight");
  });

  try {
    localforage.removeItem(`${AppState.book.key()}-highlights`);
  } catch (err) {
    console.log(err);
  }

  AppState.highlights = [];

  AppState.updateHighlightList($highlight_list);
}

function bookmarkCurrentPage() {
  AppState.pushCurrentLocationToBookmarks($bookmark_list);
}

function resetBookmarks() {
  try {
    localforage.removeItem(`${AppState.book.key()}-bookmarks`);
  } catch (err) {
    console.log(err);
  }

  AppState.bookmarks = [];

  AppState.updateBookmarkList($bookmark_list);
}

/**
 * Called as an event attached to the search bar
 * TODO: Make it search from current position
 */
async function searchInBook(e) {

  // Removing previous highlights if there were any
  if (AppState.currentSearchResultCFI) {
    AppState.removeSearchHighlight();
    AppState.currentSearchResultCFI = "";
    AppState.searchResults = [];
  }

  // Resetting search values
  $search_results_current.value = null;
  $search_results_total.textContent = 'Searching...'

  // Fixes a massive memory leak when you empty the search string.
  // Without this, clearing the search bar will basically crash the app.
  if (!e.target.value) {
    $search_results_total.textContent = '-'
    throw 'Search is empty.'
  }

  const query = await AppState.doSearch(e.target.value);
  if (query.length === 0) {
    $search_results_total.textContent = '-';
    throw 'No results found.'
  };

  // Storing the results inside AppState so that the results are easier
  // to manipulate and use with other functions
  AppState.searchResults = query;

  $search_results_total.textContent = query.length;
  $search_results_current.max = query.length;

  AppState.jumpToSearchCFI(0, $search_results_current);
}

function jumpToSearchResult(e) {
  // We subtract by 1 because the results, being an array, start at 0
  // but it makes more sense to most users to start at 1
  // so we subtract to compensate for that
  const result = e.target.value - 1;

  AppState.jumpToSearchCFI(result);
}

function changeVoice(e) {
  AppState.speech.voice = AppState.voices[e.target.value];
}

/** Reads the selected text, but if not, reads whole page */
function startSpeech() {
  if (AppState.currentSelectionText)
    AppState.speech.text = AppState.currentSelectionText;
  else
    AppState.speech.text = AppState.currentPageText;

  window.speechSynthesis.speak(AppState.speech);
}

function stopSpeech() {
  window.speechSynthesis.cancel();
}
