import State from "./State.js";
import { elementFactory, getIndexedDBUsage, asyncForEach } from "./Utils.js";

/**
 * @type {HTMLElement} libraryElement The div element to display each book in the library
 * @type {HTMLElement} storageQuotaEl
 * @type {HTMLElement} storageUsageEl
 * @type {HTMLElement} storagePercentEl
 */
export default class Library {
  constructor(
    libraryEl = null,
    storageUsageEl = null,
    storageQuotaEl = null,
    storagePercentEl = null,
  ) {
    this.bookLib = [];

    // HTML elements
    this.libraryEl = libraryEl;
    this.storageUsageEl = storageUsageEl;
    this.storageQuotaEl = storageQuotaEl;
    this.storagePercentEl = storagePercentEl;
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
    let value = null;
    try {
      value = await localforage.removeItem('Library');
    } catch (err) {
      console.log(err);
    }
    await this.refreshLibraryDisplay();
    return value;
  }

  // TODO: Make this function populate the div with contents of bookLib
  // NOTE: May need to use await on state.openBook
  /**
   * Updates the library div element with a display of the items.
   * Call after updating this.bookLib.
   * @type {HTMLElement} libraryElement
   */
  async refreshLibraryDisplay(libraryElement = this.libraryEl) {
    this.refreshStorageDisplay();

    if (this.bookLib.length === 0) {
      // Putting these functions up here and below, after the list is created,
      // achieves a 'seamless' refresh and allows for it to update
      // as well in case we clear bookLib
      libraryElement.innerHTML = "";
      return;
    }

    // We use a docfrag to add elements in a performant way
    const docFrag = new DocumentFragment();

    const listParent = elementFactory('ul');

    // Iterate over this.bookLib and create list elements
    this.bookLib.forEach(async (book, index) => {
      const state = new State();
      await state.openBook(book.bookData);

      // Creating and modifying the list element
      const bookElement = elementFactory('li', {
      });
      bookElement.innerHTML = state.metadata.title;
      bookElement.onclick = this.openReaderEvent(index);

      listParent.appendChild(bookElement);
    });

    // NOTE: Has worse performance than regular version
    // asyncForEach(this.bookLib, async (book, index) => {
    //   const state = new State();
    //   await state.openBook(book.bookData);
    //
    //   // Creating and modifying the list element
    //   const bookElement = elementFactory('li', {
    //   });
    //   bookElement.innerHTML = state.metadata.title;
    //
    //   listParent.appendChild(bookElement);
    // });

    docFrag.append(listParent);

    // Clear element before appending
    // It's put here so that it appears to change instantly
    libraryElement.innerHTML = "";
    libraryElement.appendChild(docFrag);
  }

  /**
   * Updates the storage display.
   * Should be done after refreshing library
   */
  async refreshStorageDisplay() {
    const storage = await getIndexedDBUsage();
    this.storageQuotaEl.innerHTML = storage.quota;
    this.storageUsageEl.innerHTML = storage.usage;
    this.storagePercentEl.innerHTML = storage.percent;

  }

  storeBookToLib(bookData) {
    let itemToSave = new LibItem(bookData);
    this.bookLib.push(itemToSave);
    this.saveLibrary();
  }

  /**
   * Stores the index of the clicked book in localstorage,
   * then goes to the 'reader.html' which opens the book in the
   * stored index. Use this as the event on click for the library
   * items.
   * @param {Number} storageIndex Index of book to be opened in the 'Library' key in localstorage/IndexedDB
   */
  openReaderEvent(storageIndex) {
    // We return a function here as a workaround to pass parameters
    return async () => {
      try {
        await localStorage.setItem('OpenedBookLibIndex', storageIndex);
        // TODO: Change this from the 'js/' dir to... somewhere else
        window.location.href = "/reader";
      } catch (err) {
        console.log(`ERROR: ${err}`);
      }
    }
  }
}
