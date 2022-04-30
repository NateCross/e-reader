/**
 * Manages state of the entire app.
 * Load the epub.js and localforage script before this.
 * @class
 * @param {ePub} ePubJS - the epub.js object
 */
export default class State {
  constructor(ePubJS) {
    this.ePubJS = ePubJS;

    /**
     * Stores the current book.
     * @private
     */
    this._book;

    /**
     * Stores the current renderer.
     * @private
     */
    this._rendition;

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

    this._book = ePub(); // Reset book

    let bookData;

    // Checks if the parameter is a url or an event
    // The latter triggers when openBookEvent is used
    if (e.target)
      bookData = e.target.result;
    else
      bookData = e;

    try {
      promise = this._book.open(bookData);
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
      this._rendition = this._book.renderTo(viewer, {
        width: width,
        height: height,
      });

      this._rendition.display();
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }
  }

  reset() {
    if (this._book)
      this._book.destroy();
    if (this._rendition)
      this._rendition.destroy();
    // TODO: Insert code to remove inputs
  }

  // Credit: @tony19
  // https://stackoverflow.com/a/19183658
  // _getBase64Image(img) {
  //   var canvas = document.createElement("canvas");
  //   canvas.width = img.width;
  //   canvas.height = img.height;
  //
  //   var ctx = canvas.getContext("2d");
  //   ctx.drawImage(img, 0, 0);
  //
  //   var dataURL = canvas.toDataURL("image/png");
  //
  //   return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
  // }

  get metadata() {
    return this._book.packaging.metadata;
  }

  get currPage() {
    return this.currentPage;
  }
}
