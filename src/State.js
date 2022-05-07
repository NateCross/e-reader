import { elementFactory } from './Utils.js';
// import { defaultOptions } from './Options.js';

// TODO: Error messages for the try catch

/**
 * Manages state of the entire app.
 * Load the epub.js and localforage script before this.
 * @class
 * @param {ePub} ePubJS - the epub.js object
 */
export default class State {
  constructor() {
    /**
     * Stores the current book.
     */
    this.book;

    /**
     * Stores the current renderer.
     */
    this.rendition;

    this.bookSections = [];
    // Needed for syncing the table of contents
    // this.reversedSections;

    this.currentLocation;
    this.percentage;

    this.storedLocations;
    this.savedLocation;

    this.Keybinds = {
      'ArrowLeft': this.prevPage,
      'ArrowRight': this.nextPage,
    };

    /**
     * Stores the currently selected text inside the rendition
     * so it is easier to manipulate with other functions
     * Is cleared on the mousedown event inside rendition.
     * This means that clicking outside will not clear;
     * this is intentional.
     */
    this.currentSelectionText = "";

    /**
     * Stores the currently selected CFI
     * so it is easier to manipulate with other functions
     * Is cleared on the mousedown event inside rendition.
     * This means that clicking outside will not clear;
     * this is intentional.
     */

    this.currentSelectionCFI = "";

    /**
     * An arbitrary value used when paginating.
     * Higher number means more characters per 'page'
     */
    this.locationBreakAfterXCharacters = 600;

    /**
     * Current page range. Used to restore in case the user
     * deletes the page range value
     */
    this.currentPageRange = "";

    /**
     * Stores the user's highlights as an epub CFI. Retrieved with localforage.
     * Given a CFI, we can extract info from it.
     */
    this.highlights = [];

    /**
     * Stores the user's bookmarks. Retrieved with localforage.
     * A bookmark is basically just an epub CFI.
     * We can get data about it with other functions here.
     */
    this.bookmarks = [];

    /**
     * Stores the user's highlights. Retrieved with localforage
     */
    this.searchResults = [];
    this.currentSearchResult;
    this.currentSearchResultCFI = "";
    this.currentPageText = "";

    // Text to speech
    this.speech;
    this.activateTextToSpeech = false;
    this.voices = [];

    this.coverURL = "";

    this.settingsDefault = {
      flow: 'paginated',
      width: '100%',
      height: 600,
      fontSize: 15,
      font: 'Times New Roman',
      theme: 'Light',
      speech: {
        volume: 1,
        rate: 1,
        pitch: 1,
      },
    }
    this.settingsOptions = {
      flow: ['paginated', 'scrolled-doc'],
      font: ['Times New Roman', 'Arial', 'Helvetica', 'Verdana', 'Garamond', 'Georgia'],
      theme: ['Light', 'Dark', 'Tan'],
    }
    this.settings = {};
  }

  async storeSettings() {
    let value;
    try {
      value = await localforage.setItem('Settings', this.settings);
      console.log('Stored user settings');
    } catch (err) {
      console.log(err);
    }
    return value;
  }

  async getStoredSettings() {
    try {
      this.settings = await localforage.getItem('Settings') || this.settingsDefault;
      console.log('Loaded user settings');
    } catch (err) {
      console.log(err);
    }
  }

  async removeStoredSettings() {
    try {
      this.settings = this.settingsDefault;
      await this.storeSettings();
    } catch (err) {
      console.log(err);
    }
  }

  // Returns a promise
  // Use in async/await stuff
  // Can be passed to events or used as-is, with a url
  /**
   * Opens a book; can be used as a parameter for a FileReader load event
   * or used as-is with a link to a file
   * @param {ArrayBuffer|string}
   */
  async openBook(bookData) {
    let promise = null;

    this.book = ePub(); // Reset book

    try {
      promise = this.book.open(bookData);
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }

    return promise;
  }

  /**
   * Function to render the book to a div.
   * @type {HTMLElement} viewer Div to render the book to
   * @param {String} width Percent value
   * @param {String|Number} height Can be a percent value
   */
  renderBook(viewer) {
    // allowScriptedContent is set to true to fix a weird bug
    // where clicking on the rendition would not allow you to
    // use the left and right arrow keys to go prev/next
    try {
      this.rendition = this.book.renderTo(viewer, {
        // manager: "continuous",
        flow: this.settings.flow,
        width: this.settings.width,
        height: this.settings.height,
        allowScriptedContent: true,
        snap: true,
      });
      /*
      *  NOTE: On rendition stuff:
      * - If the manager: 'continuous', the arrow keys inside
      *   the rendition break. However, it works okay if outside.
      * - It seems ideal to combine method: 'continuous' and
      *   flow: 'scrolled',
      * - Actually, manager: 'continuous' breaks everything so
      *   we shall refrain from using it
      */

      this.bookCoverBlob();
      this.renderSavedLocation();

    } catch (err) {
      console.log(`ERROR: ${err}`);
    }

  }

  reset() {
    if (this.book)
      this.book.destroy();
    if (this.rendition)
      this.rendition.destroy();
    // TODO: Insert code to remove inputs
  }

  get metadata() {
    return this.book.packaging.metadata;
  }

  bookCoverBlob() {
    this.book.coverUrl().then(e => {
      this.coverURL = e;
    });
  }

  // https://github.com/futurepress/epub.js/issues/986#issuecomment-538716885
  /** Used in loading table of contents */
  async getCfiFromHref(href) {
    const id = href.split('#')[1]
    const item = this.book.spine.get(href)
    await item.load(this.book.load.bind(this.book))
    const el = id ? item.document.getElementById(id) : item.document.body
    return item.cfiFromElement(el)
  };

  updateBookTitle($title) {
    $title.innerHTML = this.metadata.title;
  }

  /** Chain this and updateStoredLocations */
  async getStoredLocations($page_total) {
    this.savedLocation = localStorage.getItem(`${this.book.key()}-currLoc`);
    this.storedLocations = localStorage.getItem(`${this.book.key()}-locations`);

    if (this.storedLocations)
      await this.book.locations.load(this.storedLocations);
    else
      await this.book.locations.generate(
        this.locationBreakAfterXCharacters
      );

    this.updateStoredLocations($page_total);
  }

  updateStoredLocations($page_total) {
    localStorage.setItem(
      `${this.book.key()}-locations`,
      this.book.locations.save()
    );

    $page_total.innerHTML = this.book.locations.total;
  }

  /**
   * Deletes the currently open book's locations in localstorage,
   * then generates again to be saved
   * @type {HTMLElement} $page_total
   */
  resetStoredLocations($page_total) {
    localStorage.removeItem(`${this.book.key()}-locations`);

    this.getStoredLocations($page_total);
  }


  renderSavedLocation() {
    this.savedLocation = localStorage.getItem(`${this.book.key()}-currLoc`);

    if (this.savedLocation)
      this.rendition.display(this.savedLocation);
    else
      this.rendition.display();
  }

  async loadTableOfContents($toc) {
    const tocArr = await this.book.loaded.navigation;

      // Using document fragments allow us to add a lot of options
      // to the "select" element that is our table of contents
      // in one go in a lightweight manner
    const docFrag = new DocumentFragment();

    tocArr.forEach(chapter => {
      let option = elementFactory('option', {
      });
      option.ref = chapter.href;
      option.textContent = chapter.label,

      this.getCfiFromHref(chapter.href).then(cfi => {
        this.bookSections.push(cfi);
      });

      docFrag.appendChild(option);
    });
    // this.reversedSections = this.bookSections.slice().reverse();
    // console.log(this.reversedSections);

    $toc.appendChild(docFrag);

    $toc.onchange = e => {
      const index = $toc.selectedIndex;
      const url = $toc.options[index].ref;
      this.rendition.display(url);
      e.preventDefault();
    }
  }

  nextPage(e) {
    this.rendition.next();
    if (e)
      e.preventDefault();
  }

  prevPage(e) {
    this.rendition.prev();
    if (e)
      e.preventDefault();
  }

  /**
   * Saves current location as a link in localstorage
   * @param {Location} location The location returned from the 'relocated' rendition event
   */
  saveCurrentLocation(location) {
    if (!window.localStorage) return;

    localStorage.setItem(`${this.book.key()}-currLoc`, location.start.cfi);
  }

  resetCurrentLocation() {
    localStorage.removeItem(`${this.book.key()}-currLoc`);
  }

  /**
   * Resets the open book's current page, locations
   * @type {HTMLElement} $viewer We pass the viewer div to refresh it after
   * @type {HTMLElement} $page_total Passed to resetStoredLocations
   */
  resetCurrentBookUserData($viewer, $page_total) {
    this.resetStoredLocations($page_total);
    this.resetCurrentLocation();

    // TODO: these functions
    // this.resetHighlights();
    // this.resetBookmarks();

    this.renderBook($viewer);
  }

  /**
   * Updates current page display.
   * Due to the unique nature of epubs only really containing text,
   * the amount of pages in a book varies per user.
   * That is why this returns a string depicting page ranges.
   * The page ranges are calibrated so that going to the pages
   * work properly; they do not work like this normally in the library
   * @param {Location} location The location returned from the 'relocated' rendition event
   * @type {HTMLElement} $page_current
   * @type {HTMLElement} $page_percent
   */
  updateCurrentPageRange(location, $page_current, $page_percent) {

    // Get percent values
    const startPercent = (location.start.percentage * 100).toFixed(2);
    let endPercent = (location.end.percentage * 100).toFixed(2);

    const startPage = this.book.locations.locationFromCfi(location.start.cfi);

    // Subtracts endPage by 1 so it doesn't overlap with the start of the next page
    // However, so the pagination makes sense, it doesn't do this
    // for the last page
    let endPage = this.book.locations.locationFromCfi(location.end.cfi);
    if (endPercent != 100 && startPage !== endPage) {
      --endPage;
      endPercent = (endPage / this.book.locations.total * 100).toFixed(2);
    }

    // Different stylings based on the current location.
    // Can be modified without really breaking anything
    let pageRange;
    if (location.atStart)
      pageRange = `Cover`;
    else if (startPage === endPage)
      pageRange = `${startPage}`;
    else
      pageRange = `${startPage} - ${endPage}`;

    $page_current.value = pageRange;
    this.currentPageRange = pageRange;

    if (startPercent === endPercent)
      $page_percent.innerHTML = `(${startPercent}%)`;
    else
      $page_percent.innerHTML = `(${startPercent}% - ${endPercent}%)`
  }

  /**
   * A jury rigged way to sync current section with the TOC.
   * The location returned from the 'relocated' event does not
   * actually return which section the reader is in.
   * To achieve this, we want to compare cfis with each
   * section generated in the book. We want to get the first index
   * that fails to be earlier, but as far as I know, findIndex
   * does not work this way. So we invert the condition and reverse
   * the section array so we can essentially do findIndex in reverse.
   * All this to say, we want to get the last section where
   * the end cfi is not earlier than the section's start.
   * This way, we get the first section where the end cfi is earlier.
   * @param {Location} location The location returned from the 'relocated' rendition event
   * @type {HTMLElement} $toc <select> with multiple <option> inside
   */
  updateCurrentSection(location, $toc) {
    const reversedSections = this.bookSections.slice().reverse();
    const cfiComparison = new ePub.CFI();
    const sectionIndex = reversedSections.findIndex(section =>
      cfiComparison.compare(section, location.end.cfi) < 0
    );
    $toc.selectedIndex = this.bookSections.length - sectionIndex - 1;
  }

  /**
   * Execute this to initialize the relocation functions
   * This updates the current page of the HTML elements passed as parameters,
   * updates the saved location in localstorage, and
   * gets the current section
   * @type {HTMLElement} $page_current
   * @type {HTMLElement} $page_percent
   * @type {HTMLElement} $toc
   * @type {HTMLElement} $page_slider
   */
  attachRelocatedEvent($page_current, $page_percent, $toc, $page_slider) {
    this.rendition.on('relocated', location => {
      console.log(location);
      this.currentLocation = location;

      this.saveCurrentLocation(location);

      this.updateCurrentPageRange(location, $page_current, $page_percent);

      this.updateCurrentSection(location, $toc);

      this.currentPageText = this.getCurrentPageText(location);

      $page_slider.value = location.end.percentage * 100;
    });
  }

  /**
   * Execute to allow grabbing the selected contents
   * inside the renderer. We can get events here with
   * 'contents.document.<event>', like
   * 'contents.document.onmouseup' to select properly
   * without the weird debounce of the library
   */
  attachContentsSelectionHook($viewer) {
    this.rendition.hooks.content.register((contents, view) => {
      this.#attachMouseDownEvent(contents);
      this.#attachMouseUpEvent(contents);
      this.#attachTouchEvents(contents, $viewer);
    });
  }

  // https://github.com/futurepress/epub.js/wiki/Tips-and-Tricks-(v0.3)#swipe-to-turn-pages-with-touchevents
  /** Adds swipe to turn functionality */
  #attachTouchEvents(contents, $viewer) {
    const el = contents.document.documentElement;

    if (!el) return;

    let start, end;

    el.addEventListener('touchstart', e => {
      start = e.changedTouches[0];

      if (!contents.window.getSelection) return;

      contents.window.getSelection().empty();
      this.currentSelectionText = "";
      this.currentSelectionCFI = "";
    });

    el.addEventListener('touchend', e => {
      end = e.changedTouches[0];

      // Handling the swipe to turn page
      const bound = $viewer.getBoundingClientRect();
      const hr = (end.screenX - start.screenX) / bound.width;
      const vr = Math.abs((end.screenY - start.screenY) / bound.height);
      if (hr > 0.25 && vr < 0.1)
        return this.rendition.prev();
      if (hr < -0.25 && vr < 0.1)
        return this.rendition.next();

      // Fixes highlights and getting text on mobile
      // FIX: Having it in a separate function does not work
      // this.getCurrentSelectionTextAndCFI(contents);
      const { text, range } = this.#mouseUpEventGetText(contents);

      if (!text || !range) return;

      const cfiRange = new ePub.CFI(range, contents.cfiBase).toString();

      this.currentSelectionText = text;
      this.currentSelectionCFI = cfiRange;

    });

  }

  /**
   * Use this to clear text and other popups from mouseup
   * NOTE: May not be necessary?
   * @private
   * @param {Contents} contents Contents from rendition.hooks.content.register
   */
  #attachMouseDownEvent(contents) {
    contents.document.onmousedown = () => {
      if (!contents.window.getSelection) return;

      // Clears current selection
      contents.window.getSelection().empty();
      this.currentSelectionText = "";
      this.currentSelectionCFI = "";

      // console.log(this);
    };
  }

  /**
   * Handles getting the text and CFI of currently selected
   * text
   * @private
   * @param {Contents} contents Contents from rendition.hooks.content.register
   */
  #attachMouseUpEvent(contents) {
    contents.document.onmouseup = () => {
      this.getCurrentSelectionTextAndCFI(contents);
    };
  }

  getCurrentSelectionTextAndCFI(contents) {
    const { text, range } = this.#mouseUpEventGetText(contents);

    if (!text || !range) return;

    const cfiRange = new ePub.CFI(range, contents.cfiBase).toString();

    this.currentSelectionText = text;
    this.currentSelectionCFI = cfiRange;
  }

  #mouseUpEventGetText(contents) {
    const selection = contents.window.getSelection();
    const range = selection.getRangeAt(0);
    if (range.collapsed) return {};

    // Replace next line characters with a blank space
    const text = selection.toString().trim().replace(/\n/g, ' ');
    return { text, range };
  }

  pushSelectionToHighlights($highlight_list) {
    this.highlights.push(this.currentSelectionCFI);
    this.updateHighlightList($highlight_list);
    this.saveHighlights();
  }

  saveHighlights() {
    try {
      localforage.setItem(`${this.book.key()}-highlights`, this.highlights);
    } catch(err) {
      console.log(err);
    }
  }

  /**
   * @type {HTMLElement} $highlight_list
   */
  async getStoredHighlights($highlight_list) {
    try {
      this.highlights = await localforage.getItem(`${this.book.key()}-highlights`) || [];
      if (this.highlights) {
        this.highlights.forEach(highlight => {
          this.rendition.annotations.add(
            "highlight",
            highlight,
            {},
          );
        });
        this.updateHighlightList($highlight_list);
      }
    } catch(err) {
      console.log(err);
    }
  }

  async getStoredBookmarks($bookmark_list) {
    try {
      this.bookmarks = await localforage.getItem(`${this.book.key()}-bookmarks`) || [];
      if (!this.bookmarks) return;

      this.updateBookmarkList($bookmark_list);
    } catch(err) {
      console.log(err);
    }
  }

  /**
   * @type {HTMLElement} $highlight_list
   */
  updateHighlightList($highlight_list) {
    const docFrag = new DocumentFragment();

    const list = elementFactory('ul');

    this.highlights.forEach(highlight => {
      let li = elementFactory('li');
      let text = elementFactory('p');
      let pageNum = elementFactory('a');
      let remove = elementFactory('a');

      this.book.getRange(highlight).then(range => {
        text.textContent = range.toString();

        pageNum.textContent = this.book.locations.locationFromCfi(highlight);
        pageNum.onclick = () => {
          this.book.rendition.display(highlight)
        }

        remove.textContent = 'Remove Highlight';
        remove.onclick = () => {
          this.removeHighlight($highlight_list, highlight);
        };

        li.appendChild(pageNum);
        li.appendChild(text);
        li.appendChild(remove);
        list.appendChild(li);
      });
    });
    docFrag.appendChild(list);
    $highlight_list.innerHTML = "";
    $highlight_list.appendChild(docFrag);
  }

  removeHighlight($highlight_list, cfi) {
    this.rendition.annotations.remove(cfi, 'highlight');
    const indexToRemove = this.highlights.indexOf(cfi);
    this.highlights.splice(indexToRemove, 1);

    this.saveHighlights();
    this.updateHighlightList($highlight_list);
  }

  /**
   * @type {HTMLElement} $bookmark_list
   */
  pushCurrentLocationToBookmarks($bookmark_list) {
    if (this.bookmarks.includes(this.currentLocation.start.cfi)) return;

    this.bookmarks.push(this.currentLocation.start.cfi);
    this.updateBookmarkList($bookmark_list);
    this.saveBookmarks();
  }

  removeBookmark($bookmark_list, cfi) {
    const indexToRemove = this.bookmarks.indexOf(cfi);
    this.bookmarks.splice(indexToRemove, 1);

    this.saveBookmarks();
    this.updateBookmarkList($bookmark_list);
  }

  saveBookmarks() {
    try {
      localforage.setItem(`${this.book.key()}-bookmarks`, this.bookmarks);
    } catch(err) {
      console.log(err);
    }
  }

  /**
   * @type {HTMLElement} $bookmark_list
   */
  updateBookmarkList($bookmark_list) {
    const docFrag = new DocumentFragment();

    const list = elementFactory('ul');

    this.bookmarks.forEach(bookmark => {
      let li = elementFactory('li');
      // let text = elementFactory('p');
      let pageNum = elementFactory('a');
      let remove = elementFactory('a');

      // this.book.getRange(bookmark).then(range => {
      //   text.textContent = range.toString();

      pageNum.textContent = this.book.locations.locationFromCfi(bookmark);
      pageNum.onclick = () => {
        this.book.rendition.display(bookmark)
      }

      remove.textContent = 'Remove Bookmark';
      remove.onclick = () => {
        this.removeBookmark($bookmark_list, bookmark);
      };

      li.appendChild(pageNum);
      // li.appendChild(text);
      li.appendChild(remove);
      list.appendChild(li);
    });
    docFrag.appendChild(list);
    $bookmark_list.innerHTML = ""; // Clear before appending
    $bookmark_list.appendChild(docFrag);
  }

  // https://github.com/futurepress/epub.js/wiki/Tips-and-Tricks-%28v0.3%29#searching-the-entire-book
  doSearch(q) {
    // this.currentSearchResult = 0;
    return Promise.all(
      this.book.spine.spineItems.map(item => item.load(this.book.load.bind(this.book)).then(item.find.bind(item, q)).finally(item.unload.bind(item)))
    ).then(results => Promise.resolve([].concat.apply([], results)));
  };

  /**
   * doSearch returns an array of CFIs with an excerpt.
   * This function handles jumping to an index within that array
   */
  jumpToSearchCFI(resultNumber = 0, $search_results_current) {
    if (this.currentSearchResultCFI)
      this.removeSearchHighlight();

    const cfiToJump = this.searchResults[resultNumber].cfi;
    if (!cfiToJump) {
      $search_results_current.value = 0;
      throw 'Unable to find search result.';
    }

    this.rendition.display(cfiToJump);
    this.highlightSearchResult(cfiToJump);
    this.currentSearchResultCFI = cfiToJump;

    // Only triggers when a new search is made, from 'searchInBook'
    // of reader.js. Makes the search results more intuitive.
    if ($search_results_current)
      $search_results_current.value = 1;
  }

  /**
   * We remove the search highlight with a different function
   * compared to the other highlight function so that it does
   * not save into our localstorage.
   */
  removeSearchHighlight(cfi = this.currentSearchResultCFI) {
    this.rendition.annotations.remove(cfi, 'highlight');
  }

  highlightSearchResult(cfi) {
    // NOTE: This applies the 'searchResult' CSS class to
    // the result. So, the searchResult class must be styled.
    this.rendition.annotations.highlight(cfi, {}, {}, 'searchResult');
  }

  // https://github.com/futurepress/epub.js/issues/777
  /**
   * Gets all the text on the page. Note that some filtering could be needed.
   * Used for assistive technologies, especially text-to-speech.
   * @param {Location} location The location returned in the 'relocated' rendition event
   */
  getCurrentPageText(location) {
    const startRange = this.rendition.getRange(location.start.cfi);
    const endRange = this.rendition.getRange(location.end.cfi);
    startRange.setEnd(endRange.startContainer, endRange.startOffset);
    return startRange.toString();
  }

  async initializeSpeech($voices) {
    this.speech = new SpeechSynthesisUtterance();
    // this.speech = window.speechSynthesis;

    // TODO: Make these options
    this.speech.lang = "en";  // en is default
    this.speech.volume = 1;   // Range from 0 to 1
    this.speech.rate = 1;     // Range from 0.1 to 10
    this.speech.pitch = 1;    // Range from 0 to 2

    // Triggers when voices are loaded
    window.speechSynthesis.onvoiceschanged = () => {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length === 0){
        throw 'Unable to load voices for Speech Synthesis.'
      }

      // $voices.style.display = 'inline';

      console.log('Speech is ready');
      this.speech.voice = voices[0];

      const docFrag = new DocumentFragment();
      this.voices.forEach(voice => {
        const option = elementFactory('option');
        option.textContent = voice.name;

        docFrag.appendChild(option);
      });

      $voices.appendChild(docFrag);
    };
  }

  /**
   * Handles changing font size. Using a num here so it's more intuitive
   */
  setRenditionFontSize() {
    this.rendition.themes.fontSize(`${this.settings.fontSize}px`);
  }

  setRenditionFont() {
    this.rendition.themes.font(this.settings.font);
  }

  /** The themes must be registered first like this according to the epubjs docs */
  initializeThemes() {
    this.settingsOptions.theme.forEach(theme => {
      this.rendition.themes.register(theme, "./css/themes.css");
    });
  }

  setRenditionTheme() {
    this.rendition.themes.select(this.settings.theme);
  }
}
