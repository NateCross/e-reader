// TODO: Find a way to use epub.js functions here so it can
//       automatically get data

class BookData {
  constructor(bookObjURL, metadata, coverURL = null) {
    this.bookObjURL = bookObjURL;   // An object URL. Used to open with 'ePub(bookURL)'
    this.metadata = metadata;       // Object of metadata. Used to view metadata without opening an ePub
    this.key = metadata.identifier; // We get this explicitly to use as primary key
    this.coverURL = coverURL;
    this.currentPage; // TODO: Find a way to get current page/cfi
  }
}
