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
    this.bookLib = []; // NOTE: Try to use the localitemstorage here
    this.bookSections = [];

    this.currentSection;
    this.currentPage;
    this.totalPages;
    this.percentage;

    this.locationBreakAfterXCharacters = 600;
  }

  /**
   * Call this function to load localforage upon start
   * @function
   */
  async init() {
    this.bookLib = await this.getLibrary() || this.bookLib;
  }

  openBookEvent(e) {
    const file = e.target.files[0];
    if (window.FileReader) {
      let reader = new FileReader();
      reader.onload = this.openBook;
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
  async openBook(e) {
    let promise = null;

    this.book = ePub(); // Reset book

    let bookData;

    // Checks if the parameter is a url or an event
    // The latter triggers when openBookEvent is used
    if (e.target)
      bookData = e.target.result;
    else
      bookData = e;

    try {
      promise = this.book.open(bookData);
      this.storeBookToLib(bookData);
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }
    return promise;
  }

  // storeBookToLib(arrayBuffer) {
  //
  // }

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

  storeBookToLib(bookData) {
    let itemToSave = new LibItem(bookData);
    this.bookLib.push(itemToSave);
    this.saveLibrary();
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

  async getBookCoverBase64() {
    const cover = await this.bookCoverBlob;
    const blob = new Blob([cover], {type: 'image/png'});
    let base64 = await this.blobToBase64(blob);
    base64 = base64.substr(base64.indexOf(',') + 1);
    console.log(base64)
    return base64;
  }

  // https://stackoverflow.com/a/18650249
  /**
   * Used in converting bookCoverUrl to a base64 string
   * allowing the image to be saved in localstorage
   * @function
   * @param {Blob} blob An image blob
   * @returns {Promise} promise
   */
  blobToBase64(blob) {
    // console.log(blob);
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    // var reader = new FileReader();
    // reader.readAsDataURL(blob);
    // reader.onloadend = function() {
    //   var base64data = reader.result;
    // }
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
