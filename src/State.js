import LibItem from './LibItem.js';
import { elementFactory } from './Utils.js';

/**
 * Manages state of the entire app.
 * Load the epub.js and localforage script before this.
 * @class
 * @param {ePub} ePubJS - the epub.js object
 */
export default class State {
  savedLocation;
  storedLocations;


  constructor(
    $page_current = null,
    $page_total = null,
    $page_percent = null,
    $title = null,
    $toc = null,
    $viewer,
    $prev,
    $next,
  ) {
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

    this.currentSection;
    this.percentage;

    this.$page_total = $page_total;
    this.$page_current = $page_current;
    this.$page_percent = $page_percent;
    this.$title = $title;
    this.$toc = $toc;
    this.$viewer = $viewer;
    this.$prev = $prev;
    this.$next = $next;

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

  renderBook(viewer = this.$viewer, width = "100%", height = 600) {
    // this.rendition = null;
    try {
      this.rendition = this.book.renderTo(viewer, {
        width: width,
        height: height,
      });

      this.rendition.display();
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

  updateBookTitle() {
    this.$title.innerHTML = this.metadata.title;
  }

  /** Chain this and updateStoredLocations */
  getStoredLocations() {
    this.savedLocation = localStorage.getItem(`${this.book.key()}-currLoc`);
    this.storedLocations = localStorage.getItem(`${this.book.key()}-locations`);

    if (this.storedLocations)
      this.book.locations.load(this.storedLocations);
    else
      this.book.locations.generate(
        this.locationBreakAfterXCharacters
      );
  }

  updateStoredLocations() {
    localStorage.setItem(
      `${this.book.key()}-locations`,
      this.book.locations.save()
    );

    this.$page_total.innerHTML = this.book.locations.total;
  }

  renderSavedLocation() {
    this.savedLocation = localStorage.getItem(`${this.book.key()}-currLoc`);

    if (this.savedLocation)
      this.rendition.display(this.savedLocation);
    else
      this.rendition.display();
  }

  async loadTableOfContents() {
    const toc = await this.book.loaded.navigation;

      // Using document fragments allow us to add a lot of options
      // to the "select" element that is our table of contents
      // in one go in a lightweight manner
    const docFrag = new DocumentFragment();

    toc.forEach(chapter => {
      let option = elementFactory('option', {
      });
      option.ref = chapter.href;
      option.textContent = chapter.label,

      this.getCfiFromHref(chapter.href).then(cfi => {
        this.bookSections.push(cfi);
      });

      docFrag.appendChild(option);
    });

    this.$toc.appendChild(docFrag);

    this.$toc.onchange = () => {
      const index = this.$toc.selectedIndex;
      const url = this.$toc.options[index].ref;
      this.rendition.display(url);
      // return false;
    }
  }
}
