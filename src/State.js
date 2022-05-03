import LibItem from './LibItem.js';

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

    this.currentSection;
    this.currentPage;
    this.totalPages;
    this.percentage;

    this.locationBreakAfterXCharacters = 600;
  }

  // TODO: Think of a better way to handle this without passing Library
  /**
   * Hacky workaround to pass the array of books in the library
   * to the individual book state.
   * Use by executing the function when passed as
   * parameter to an event "openBookEvent()"
   * @param {Library} Library
   * @type {HTMLElement} libraryElem
   * @returns {Function}
   */
  openBookEvent(Library) {
    return e => {
      if (!window.FileReader) return;
      if (e.target.files.length === 0) return;

      const file = e.target.files[0];
      let reader = new FileReader();

      reader.onload = bookData => {
        this.storeBookToLib(bookData.target.result, Library.bookLib);
        console.log(Library.bookLib);

        // Need to execute the functions directly after uploading a book
        Library.saveLibrary();
        Library.refreshLibraryDisplay();
      };

      reader.readAsArrayBuffer(file);
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

  renderBook(viewer, width = "100%", height = 600) {
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

  /**
   * @param {ArrayBuffer|String} bookData
   * @param {Array} bookLib The global list of books in library
   */
  storeBookToLib(bookData, bookLib) {
    let itemToSave = new LibItem(bookData);
    bookLib.push(itemToSave);
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

  async saveLibrary() {
    try {
      const value = await localforage.setItem('Library', this.bookLib);
      return value;
    } catch (err) {
      console.log(err);
    }
  }

  async getLibrary() {
    try {
      const value = await localforage.getItem('Library');
      return value;
    } catch (err) {
      console.log(err);
    }
  }

  async clearLibrary() {
    try {
      const value = await localforage.removeItem('Library');
      return value;
    } catch (err) {
      console.log(err);
    }
  }
}
