import State from './State.js';
import * as Modals from './ModalTextContent.js';
import { showToast } from './Utils.js';

/// URL Search Parameters ///
/// Used for getting the book index to be opened ///
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const bookToOpen = urlParams.get('book');

///// HTML ELEMENTS /////

const $title = document.querySelector('#title');
const $toc = document.querySelector('#table-of-contents');
const $viewer = document.querySelector('#viewer');

const $prev = document.querySelector('#prev');
const $next = document.querySelector('#next');

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
const $search_button = document.querySelector('#search-button');
const $search_clear = document.querySelector('#search-clear');
const $search_results_current = document.querySelector('#results-current');
const $search_results_total = document.querySelector('#results-total');
const $search_results_container = document.querySelector('.search-results-container');

const $voices = document.querySelector('#voices');
const $speech_start = document.querySelector('#speech-start');
const $speech_stop = document.querySelector('#speech-stop');
const $speech = document.querySelector('.speech');

const $settings_remove = document.querySelector('#settings-remove');
// TODO: Change it to settings. This was a mistake
const $settings_flow = document.querySelector('#options-flow');
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

///// MAIN /////

// We have to create the AppState object before we perform
// the other operations here
const AppState = new State();


/**
 * The initialization function that turns everything on and hooks
 * into the various HTML elements. Also handles loading user settings.
 *
 * This is a separate function because, as has been observed, when
 * a setting is changed that adjusts the book rendition, it must be
 * re-rendered. This would require refreshing. But another way would be
 * to "delete" the viewer's inner HTML and re-run this function to
 * achieve so without forcing a refresh.
 * NOTE: Due to the above, there may or may not be memory leaks.
 * It is my understanding that there are none at the moment, but it is worth looking into.
 */
const Initialize = async () => {
  try {
    // Library is in localforage -- or indexedDB -- because it
    // can store objects. The opened book index is stored in
    // localStorage since it is just a simple number
    const Lib = await localforage.getItem('Library');
    const openedBook = bookToOpen;

    // Performing initialization operations
    // Order is not very important, as long as they are there.
    // We have to open the book and get the settings first before
    // anything else, though, or else nothing will load right
    await AppState.openBook(Lib[openedBook].bookData);
  } catch (err) {
    console.log(err);
    Modals.ErrorNoBook.showModal();
  }
  await AppState.getStoredSettings();
  AppState.renderBook($viewer);

  // These functions interact with the DOM
  // NOTE: Instead of passing an HTML element, we could pass the
  // string of the id/class instead. It would require some rewriting
  // of the functions, though.
  AppState.updateBookTitle($title);
  AppState.getStoredLocations($page_total);
  AppState.loadTableOfContents($toc);
  AppState.getStoredHighlights($highlight_list);
  AppState.getStoredBookmarks($bookmark_list);
  AppState.initializeSpeech($voices, $speech);

  attachSettingsOptions('font', $settings_font);
  attachSettingsOptions('theme', $settings_theme);

  // These functions exist in reader.js because they essentially
  // hook into a lot of elements in the document.
  // If they were in AppState, I would have to pass in a lot of
  // id names or elements. Admittedly, it looks ugly, so
  // refactoring these would be ideal.
  // initializeModals('modal-container');
  initSettingsDisplay();
  attachKeyboardInput();
  attachClickButtonInput();

  AppState.attachRelocatedEvent($page_current, $page_percent, $toc, $page_slider);

  $page_current.onchange = changeCurrentPage;
  $page_slider.onchange = pageSlider;

  $highlight.onclick = highlightCurrentTextSelection;
  $highlight_remove_all.onclick = Modals.showModalWrapper(Modals.RemoveAllHighlights, ModalResetHighlightsWrapper);

  $bookmark.onclick = bookmarkCurrentPage;
  $bookmark_remove_all.onclick = Modals.showModalWrapper(Modals.RemoveAllBookmarks, ModalResetBookmarksWrapper);

  $search_results_container.style.display = 'none';
  $search_bar.onchange = searchInBook;
  $search_button.onclick = searchInBook;
  $search_clear.onclick = clearSearch;
  $search_results_current.onchange = jumpToSearchResult;

  $voices.onchange = changeVoice;
  $speech_start.onclick = startSpeech;
  $speech_stop.onclick = stopSpeech;

  $settings_remove.onclick = Modals.showModalWrapper(Modals.ResetSettings, ModalResetSettingsWrapper);
  $settings_flow.onchange = changeSettingsFlow;
  $settings_font_size.onchange = changeFontSize;
  $settings_font.onchange = changeFont;
  $settings_theme.onchange = changeTheme;
  $settings_speech_volume.oninput = changeSpeechVolume;
  $settings_speech_rate.oninput = changeSpeechRate;
  $settings_speech_pitch.oninput = changeSpeechPitch;

  $metadata_button.onclick = Modals.showModalWrapper(Modals.Metadata, getMetadata);

  AppState.attachContentsSelectionHook($viewer);

  // Update the page title
  // Must be done after book is loaded
  document.title = `Libre Ipsum: ${AppState.metadata.title}`;
  // showToast('Finished loading book.', 'quick');
};

///// FUNCTIONS /////

function changeCurrentPage(e) {

  // Restores the current value in case the user does not want to
  // change, and stops focusing the element. This prevents confusion.
  if (!e.target.value) {
    $page_current.value = AppState.currentPageRange;
    return;
  }

  AppState.rendition.display(
    AppState.book.locations.cfiFromLocation(e.target.value)
  );
}

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
  $next.onclick = () => AppState.nextPage();
  $prev.onclick = () => AppState.prevPage();
}

function highlightCurrentTextSelection() {

  if (!AppState.currentSelectionText || !AppState.currentSelectionCFI) {
    showToast('Unable to highlight selected text.');
    return;
  }

  AppState.rendition.annotations.highlight(
    AppState.currentSelectionCFI,
    {},
    () => {
      return;
    }
  );

  AppState.pushSelectionToHighlights($highlight_list);
}

function ModalResetHighlightsWrapper(_, __, footer, container) {
  const remove = footer.querySelector('#remove');
  const cancel = footer.querySelector('#cancel');

  cancel.onclick = () => {
    container.remove();
  }
  remove.onclick = () => {
    resetHighlights();
    container.remove();
  }
}

async function resetHighlights() {
  AppState.highlights.forEach(highlight => {
    AppState.rendition.annotations.remove(highlight, "highlight");
  });

  try {
    await localforage.removeItem(`${AppState.book.key()}-highlights`);
    showToast('Successfully removed highlights.');
  } catch (err) {
    console.log(err);
    showToast('Unable to remove highlights.', 'warning');
  }

  AppState.highlights = [];

  AppState.updateHighlightList($highlight_list);
}

function bookmarkCurrentPage() {
  AppState.pushCurrentLocationToBookmarks($bookmark_list);
  showToast('Bookmarked current page.');
}

function ModalResetBookmarksWrapper(_, __, footer, container) {
  const remove = footer.querySelector('#remove');
  const cancel = footer.querySelector('#cancel');

  cancel.onclick = () => {
    container.remove();
  }
  remove.onclick = () => {
    resetBookmarks();
    container.remove();
  }
}

async function resetBookmarks() {
  try {
    await localforage.removeItem(`${AppState.book.key()}-bookmarks`);
    showToast('Successfully removed bookmarks.');
  } catch (err) {
    console.log(err);
    showToast('Unable to remove bookmarks.', 'warning');
  }

  AppState.bookmarks = [];

  AppState.updateBookmarkList($bookmark_list);
}

/**
 * Called as an event attached to the search bar
 */
async function searchInBook(e) {

  // Removing previous search highlights if there were any
  if (AppState.currentSearchResultCFI) {
    AppState.removeSearchHighlight();
    AppState.currentSearchResultCFI = "";
    AppState.searchResults = [];
  }

  // Resetting search values
  $search_results_container.style.display = 'none';
  $search_results_current.value = null;

  // Fixes a massive memory leak when you empty the search string.
  // Without this, clearing the search bar will basically crash the app.
  if (!e.target.value) {
    $search_results_total.textContent = '-'
    return;
  }

  let query;
  try {
    query = await AppState.doSearch(e.target.value);
  } catch(err) {
    console.log(err);
    return;
  }
  if (query.length === 0) {
    $search_results_total.textContent = '-';
    showToast('No search results found.');
    return;
  };

  // Storing the results inside AppState so that the results are easier
  // to manipulate and use with other functions
  AppState.searchResults = query;

  $search_results_total.textContent = query.length;
  $search_results_current.max = query.length;
  $search_results_container.style.display = 'block';

  const index = AppState.getNextSearchResultFromCurrentCFI() || 0;

  AppState.jumpToSearchCFI(index, $search_results_current);
}

function jumpToSearchResult(e) {
  // We subtract by 1 because the results, being an array, start at 0
  // but it makes more sense to most users to start at 1
  // so we subtract to compensate for that
  const result = e.target.value - 1;

  AppState.jumpToSearchCFI(result, $search_results_current);
}

function changeVoice(e) {
  AppState.speech.voice = AppState.voices[e.target.selectedIndex];
}

/** Reads the selected text, but if not, reads whole page */
function startSpeech() {
  if (AppState.currentSelectionText)
    AppState.speech.text = AppState.currentSelectionText;
  else
    AppState.speech.text = AppState.currentPageText;

  window.speechSynthesis.speak(AppState.speech);
  showToast('Speaking...');
}

function stopSpeech() {
  window.speechSynthesis.cancel();
  showToast('Stopped speaking.');
}

function ModalResetSettingsWrapper(_, __, footer, container) {
  const remove = footer.querySelector('#remove');
  const cancel = footer.querySelector('#cancel');

  cancel.onclick = () => {
    container.remove();
  }
  remove.onclick = () => {
    restoreSettingsToDefault();
    container.remove();
  }
}


/**
 * We are changing all the settings, so it is not feasible to
 * set them all one by one. Refreshing works better in this case.
 */
async function restoreSettingsToDefault() {
  try {
    await AppState.removeStoredSettings();
    refreshRendition();
  } catch (err) {
    console.log(err);
  }
}

/** Registers the settings so they take effect */
function initSettingsDisplay() {
  if (AppState.settings.flow === 'paginated')
    $settings_flow.selectedIndex = 0;
  else
    $settings_flow.selectedIndex = 1;

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
  try {
    AppState.settings.flow = e.target.value;
    await AppState.storeSettings();
    refreshRendition();
  } catch (err) {
    console.log(err);
  }
}

async function changeFontSize(e) {
  try {
    AppState.settings.fontSize = e.target.value;
    AppState.setRenditionFontSize();
    await AppState.storeSettings();
    refreshRendition();
  } catch(err) {
    console.log(err);
  }
}

function attachSettingsOptions(optionName, htmlElement) {
  const docFrag = new DocumentFragment();
  AppState.settingsOptions[optionName].forEach(opt => {
    const option = document.createElement('option');
    option.textContent = opt;
    option.value = opt;
    option.autocomplete = 'off';

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
  try {
    AppState.settings.font = e.target.value;
    AppState.setRenditionFont();
    await AppState.storeSettings();
    refreshRendition();
  } catch (err) {
    console.log(err);
  }
}

async function changeTheme(e) {
  try {
    AppState.settings.theme = e.target.value;
    AppState.setRenditionTheme();
    await AppState.storeSettings();
    refreshRendition();
  } catch (err) {
    console.log(err);
  }
}

async function changeSpeechVolume(e) {
  try {
    AppState.speech.volume = e.target.value;
    AppState.settings.speech.volume = e.target.value;
    $settings_speech_volume_val.textContent = e.target.value;
    await AppState.storeSettings();
  } catch(err) {
    console.log(err);
  }
}

async function changeSpeechRate(e) {
  try {
    AppState.speech.rate = e.target.value;
    AppState.settings.speech.rate = e.target.value;
    $settings_speech_rate_val.textContent = e.target.value;
    await AppState.storeSettings();
  } catch (err) {
    console.log(err);
  }
}

async function changeSpeechPitch(e) {
  try {
    AppState.speech.pitch = e.target.value;
    AppState.settings.speech.pitch = e.target.value;
    $settings_speech_pitch_val.textContent = e.target.value;
    await AppState.storeSettings();
  } catch(err) {
    console.log(err);
  }
}

/**
 * Used with attachModal. The elements and their ids are found in
 * the object 'Metadata' of ModalTextContent.js.
 */
function getMetadata(header, content, footer) {
  const title = header.querySelector('#metadata-title');
  const cover = content.querySelector('#metadata-cover');
  const author = content.querySelector('#metadata-author');
  const description = content.querySelector('#metadata-description');
  const pubdate = content.querySelector('#metadata-pubdate');
  const publisher = content.querySelector('#metadata-publisher');
  const rights = content.querySelector('#metadata-rights');
  const identifier = footer.querySelector('#metadata-identifier');

  title.textContent = AppState.metadata.title;
  cover.src = AppState.coverURL;
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

function clearSearch() {
  $search_bar.value = '';

  // Quick hack to emulate 'e.target.value' to prevent errors
  searchInBook({ target: { value: '' } })
}

/**
 * Call this after every time a setting is changed.
 */
function refreshRendition() {
  $viewer.innerHTML = "";
  Initialize();
}

Initialize();

console.log(AppState);
console.log('Loaded reader');
