import { elementFactory } from './Utils.js';

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
     * @private
     */
    this.book;

    /**
     * Stores the current renderer.
     * @private
     */
    this.rendition;

    /**
     *  bookLib can store either a URL string or an arraybuffer.
     *  This is going to be stored with localForage.
     */
    // this.bookLib = []; // NOTE: Try to use the localitemstorage here
    this.bookSections = [];
    // Needed for syncing the table of contents
    // this.reversedSections;

    this.currentSection;
    this.percentage;

    this.storedLocations;
    this.savedLocation;

    this.Keybinds = {
      'ArrowLeft': this.prevPage,
      'ArrowRight': this.nextPage,
    };


    this.locationBreakAfterXCharacters = 600;
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

  renderBook(viewer, width = "100%", height = 600) {
    // allowScriptedContent is set to true to fix a weird bug
    // where clicking on the rendition would not allow you to
    // use the left and right arrow keys to go prev/next
    try {
      this.rendition = this.book.renderTo(viewer, {
        width: width,
        height: height,
        allowScriptedContent: true,
      });

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

  get bookCoverBlob() {
    return this.book.coverUrl();
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
   */
  attachRelocatedEvent($page_current, $page_percent, $toc) {
    this.rendition.on('relocated', location => {
      console.log(location);

      this.saveCurrentLocation(location);

      this.updateCurrentPageRange(location, $page_current, $page_percent);

      this.updateCurrentSection(location, $toc);
    });
  }
}
