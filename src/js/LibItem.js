/**
 * Holds the file data and metadata of a book in the user's library.
 * Note that this does not store the user's bookmarks and highlights-
 * those are handled in the main State class
 * @class
 * @param {string|ArrayBuffer} bookData A URL or array buffer that is used for opening the book
 * @param {Metadata} metadata The book's metadata, obtained from get metadata() in the State class
 * @param {string} coverImg Base64 string of the cover. Needs conversion to string first after getting the image from the book in the State class.
 */
export default class LibItem {
  constructor(bookData, metadata = null, coverImg = null, category = 'Library') {
    this.bookData = bookData;
    this.metadata = metadata;
    this.coverImg = coverImg;
    this.category = category;
  }
}
