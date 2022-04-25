class State {
  constructor(ePubJS) {
    this.ePubJS = ePubJS;
    this.book;
    this.bookLib = []; // NOTE: Try to use the localitemstorage here
    this.bookSections = [];
    this.rendition;
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
  openBook(e) {
    let promise = null;

    this.book = this.ePubJS(); // Reset book

    let bookData;

    // Checks if the parameter is a url or an event
    // The latter triggers when openBookEvent is used
    if (e.target)
      bookData = e.target.result;
    else
      bookData = e;

    try {
      promise = this.book.open(bookData);
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }
    return promise;
  }

  storeBookToLib(arrayBuffer) {

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
}
