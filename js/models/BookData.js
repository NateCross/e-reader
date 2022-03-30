class BookData {
  constructor(bookObjURL, metadata, coverURL = null) {
    this.bookObjURL = bookObjURL;   // An object URL. Used to open with 'ePub(bookURL)'
    this.metadata = metadata;       // Object of metadata. Used to view metadata without opening an ePub
    this.coverURL = coverURL;
    this.key = metadata.identifier;
  }
  set metadata() {

  }
}
