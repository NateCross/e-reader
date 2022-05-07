import State from './State.js';
import { LoremIpsum, Metadata } from './ModalTextContent.js';
import { attachModal, initializeModals } from './Utils.js';

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
const $page_slider = document.querySelector('#page-slider');

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

const $settings_remove = document.querySelector('#settings-remove');
// TODO: Change it to settings
const $options_flow = document.querySelector('#options-flow');
const $settings_font_size = document.querySelector('#settings-font-size');
const $settings_font = document.querySelector('#settings-font');
const $settings_theme = document.querySelector('#settings-theme');

const $settings_speech_volume = document.querySelector('#speech-volume');
const $settings_speech_rate = document.querySelector('#speech-rate');
const $settings_speech_pitch = document.querySelector('#speech-pitch');

const $settings_speech_volume_val = document.querySelector('#speech-volume-val');
const $settings_speech_rate_val = document.querySelector('#speech-rate-val');
const $settings_speech_pitch_val = document.querySelector('#speech-pitch-val');

const $metadata_button = document.querySelector('#metadata');

// TODO: Add buttons for other features

const AppState = new State();

///// MAIN /////
const Initialize = async () => {

  // Library is in localforage -- or indexedDB -- because it
  // can store objects. The opened book index is stored in
  // localStorage since it is just a simple number
  const Lib = await localforage.getItem('Library');
  const openedBook = localStorage.getItem('OpenedBookLibIndex');
  const category = localStorage.getItem('OpenedBookLibCategory');

  // If we cannot find a book to open, go back to the index
  // TODO: Throw proper error message then go back
  if (!openedBook || !Lib || !Lib[category][openedBook])
    window.location.href = '/';

  // NOTE: This is still here for testing purposes.
  // TODO: Refactor stuff in the html to the js
  // openBook(Library[openedBook].bookData);

  // Performing initialization operations
  await AppState.openBook(Lib[category][openedBook].bookData);
  await AppState.getStoredSettings();
  AppState.renderBook($viewer);
  AppState.updateBookTitle($title);
  AppState.getStoredLocations($page_total);
  AppState.loadTableOfContents($toc);
  AppState.getStoredHighlights($highlight_list);
  AppState.getStoredBookmarks($bookmark_list);
  AppState.initializeSpeech($voices);
  attachSettingsOptions('font', $settings_font);
  attachSettingsOptions('theme', $settings_theme);
  initSettingsDisplay();
  initializeModals('modal-container');

  // TODO: Refactor to go inside AppState
  attachKeyboardInput();
  attachClickButtonInput();

  AppState.attachRelocatedEvent($page_current, $page_percent, $toc, $page_slider);

  $page_current.onchange = e => {
    if (!e.target.value) {
      $page_current.value = AppState.currentPageRange;
      return;
    }

    AppState.rendition.display(
      AppState.book.locations.cfiFromLocation(e.target.value)
    );
  };
  $page_slider.onchange = pageSlider;

  $highlight.onclick = highlightCurrentTextSelection;
  $highlight_remove_all.onclick = resetHighlights;

  $bookmark.onclick = bookmarkCurrentPage;
  $bookmark_remove_all.onclick = resetBookmarks;

  $search_bar.onchange = searchInBook;
  $search_results_current.onchange = jumpToSearchResult;

  $voices.onchange = changeVoice;
  $speech_start.onclick = startSpeech;
  $speech_stop.onclick = stopSpeech;

  $settings_remove.onclick = restoreSettingsToDefault;
  $options_flow.onchange = changeSettingsFlow;
  $settings_font_size.onchange = changeFontSize;
  $settings_font.onchange = changeFont;
  $settings_theme.onchange = changeTheme;
  $settings_speech_volume.oninput = changeSpeechVolume;
  $settings_speech_rate.oninput = changeSpeechRate;
  $settings_speech_pitch.oninput = changeSpeechPitch;

  $metadata_button.onclick = attachModal(Metadata, 'modal-container', getMetadata);

  AppState.attachContentsSelectionHook($viewer);

  // Update the page title
  // Must be done after book is loaded
  document.title = `E-Reader: ${AppState.metadata.title}`;
};

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

/**
 * We are changing all the settings, so it is not feasible to
 * set them all one by one. Refreshing works better in this case.
 */
async function restoreSettingsToDefault() {
  await AppState.removeStoredSettings();
  refreshRendition();
}

/** Registers the settings so they take effect */
function initSettingsDisplay() {
  if (AppState.settings.flow === 'paginated')
    $options_flow.selectedIndex = 0;
  else
    $options_flow.selectedIndex = 1;

  $settings_font_size.value = AppState.settings.fontSize;
  AppState.setRenditionFontSize();

  $settings_font.selectedIndex = AppState.settingsOptions.font.indexOf(
    AppState.settings.font
  );
  AppState.setRenditionFont();

  $settings_theme.selectedIndex = AppState.settingsOptions.theme.indexOf(
    AppState.settings.theme
  );
  AppState.initializeThemes();
  AppState.setRenditionTheme();

  $settings_speech_volume.value = AppState.settings.speech.volume;
  $settings_speech_volume_val.textContent = AppState.settings.speech.volume;
  $settings_speech_pitch.value = AppState.settings.speech.pitch;
  $settings_speech_pitch_val.textContent = AppState.settings.speech.pitch;
  $settings_speech_rate.value = AppState.settings.speech.rate;
  $settings_speech_rate_val.textContent = AppState.settings.speech.rate;
}

async function changeSettingsFlow(e) {
  AppState.settings.flow = e.target.value;
  await AppState.storeSettings();
  refreshRendition();
}

async function changeFontSize(e) {
  AppState.settings.fontSize = e.target.value;
  AppState.setRenditionFontSize();
  await AppState.storeSettings();
  refreshRendition();
}

function attachSettingsOptions(optionName, htmlElement) {
  const docFrag = new DocumentFragment();
  AppState.settingsOptions[optionName].forEach(opt => {
    const option = document.createElement('option');
    option.textContent = opt;
    option.value = opt;

    if (optionName === 'font')
      option.style['font-family'] = opt;

    if (optionName === 'theme')
      option.classList.add(opt);

    docFrag.appendChild(option);
  });
  htmlElement.innerHTML = "";
  htmlElement.appendChild(docFrag);
}

async function changeFont(e) {
  AppState.settings.font = e.target.value;
  AppState.setRenditionFont();
  await AppState.storeSettings();
  refreshRendition();
}

async function changeTheme(e) {
  AppState.settings.theme = e.target.value;
  AppState.setRenditionTheme();
  await AppState.storeSettings();
  refreshRendition();
}

async function changeSpeechVolume(e) {
  AppState.speech.volume = e.target.value;
  AppState.settings.speech.volume = e.target.value;
  $settings_speech_volume_val.textContent = e.target.value;
  await AppState.storeSettings();
}

async function changeSpeechRate(e) {
  AppState.speech.rate = e.target.value;
  AppState.settings.speech.rate = e.target.value;
  $settings_speech_rate_val.textContent = e.target.value;
  await AppState.storeSettings();
}

async function changeSpeechPitch(e) {
  AppState.speech.pitch = e.target.value;
  AppState.settings.speech.pitch = e.target.value;
  $settings_speech_pitch_val.textContent = e.target.value;
  await AppState.storeSettings();
}

/**
 * Used with attachModal. The elements and their ids are found in
 * the object 'Metadata' of ModalTextContent.js.
 */
function getMetadata() {
  const title = document.querySelector('#metadata-title');
  const author = document.querySelector('#metadata-author');
  const description = document.querySelector('#metadata-description');
  const pubdate = document.querySelector('#metadata-pubdate');
  const publisher = document.querySelector('#metadata-publisher');
  const rights = document.querySelector('#metadata-rights');
  const identifier = document.querySelector('#metadata-identifier');

  title.textContent = AppState.metadata.title;
  author.textContent = `Author: ${AppState.metadata.creator || '-'}`;
  description.textContent = `Description: ${AppState.metadata.description || '-'}`;
  pubdate.textContent = `Publication Date: ${AppState.metadata.pubdate || '-'}`;
  publisher.textContent = `Publisher: ${AppState.metadata.publisher || '-'}`;
  rights.textContent = `Rights: ${AppState.metadata.rights || '-'}`;
  identifier.textContent = AppState.metadata.identifier || '-';
}

function pageSlider(e) {
  const cfi = AppState.book.locations.cfiFromPercentage(e.target.value / 100);
  AppState.rendition.display(cfi);
}

/**
 * Call this after every time a setting is changed.
 */
function refreshRendition() {
  $viewer.innerHTML = ""; // TODO: Insert a loading image indicator or GIF
  Initialize();
}

Initialize();
