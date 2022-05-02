import State from "./State.js";
import { openBook, elementFactory } from "./Utils.js";

/**
 * @type {HTMLElement} libraryElement The div element to display each book in the library
 */
export default class Library {
  constructor(libraryElement = null) {
    this.bookLib = [];
    this.libraryElement = libraryElement;

    this.openBook = openBook;
  }

  /**
   * Call this function to load localforage upon start
   * @function
   */
  async init() {
    this.bookLib = await this.getLibrary() || [];
  }

  async getLibrary() {
    try {
      const value = await localforage.getItem('Library');
      return value;
    } catch (err) {
      console.log(err);
    }
  }

  async saveLibrary(bookLib = this.bookLib) {
    try {
      const value = await localforage.setItem('Library', bookLib);
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

  // TODO: Make this function populate the div with contents of bookLib
  // NOTE: May need to use await on state.openBook
  /**
   * Updates the library div element with a display of the items.
   * Call after updating this.bookLib.
   * @type {HTMLElement} libraryElement
   */
  async refreshLibraryDisplay(libraryElement = this.libraryElement) {
    if (this.bookLib.length === 0) return;

    // We use a docfrag to add elements in a performant way
    const docFrag = new DocumentFragment();

    const listParent = elementFactory('ul');

    for (const book of this.bookLib) {
      const state = new State();
      await state.openBook(book.bookData);
      const bookElement = elementFactory('li', {
      });
      bookElement.innerHTML = state.metadata.title;
      listParent.appendChild(bookElement);
    }

    docFrag.append(listParent);

    // Clear element before appending
    // It's put here so that it appears to change instantly
    libraryElement.innerHTML = "";
    libraryElement.appendChild(docFrag);
  }

  storeBookToLib(bookData) {
    let itemToSave = new LibItem(bookData);
    this.bookLib.push(itemToSave);
    this.saveLibrary();
  }
}
