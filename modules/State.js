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
  openBook(e) {
    let returnVal;

    this.book = this.ePubJS(); // Reset book
    let bookData = e;
    // let bookData = e.target.result || e;  // Either as exception or url
    try {
      returnVal = this.book.open(bookData);
      // this.book.open(bookData).then(promise => returnVal = promise);
    } catch (err) {
      console.log(`ERROR: ${err}`);
      returnVal = null;
    } finally {
      console.log(returnVal);
      return returnVal;
    }
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

  get metadata() {
    return this.book.packaging.metadata;
  }
};