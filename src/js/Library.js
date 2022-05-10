import State from "./State.js";
import { elementFactory, getIndexedDBUsage, showToast } from "./Utils.js";
import { showModalWrapper, RemoveBook } from './ModalTextContent.js';

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
    this.bookLib = {};

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
    this.bookLib = await this.getLibrary() || {};
  }

  async getLibrary() {
    let value = null;
    try {
      value = await localforage.getItem('Library');
    } catch (err) {
      showToast('Unable to fetch Library from storage.', 'warning');
      console.log(err);
    }
    return value;
  }

  async saveLibrary(bookLib = this.bookLib) {
    let value = null;
    try {
      value = await localforage.setItem('Library', bookLib);
    } catch (err) {
      showToast('Unable to save Library to storage.', 'warning');
      console.log(err);
    }
    return value;
  }

  async clearLibrary() {
    let value = null;
    try {
      value = await localforage.removeItem('Library');
    } catch (err) {
      showToast('Unable to clear Library.', 'warning');
      console.log(err);
    }
    try {
      value = await this.refreshLibraryDisplay();
    } catch (err) {
      showToast('Unable to refresh Library.', 'warning');
      console.log(err);
    }
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
    try {
      await this.refreshStorageDisplay();
    } catch (err) {
      showToast('Unable to refresh storage display.', 'warning');
      console.log(err);
    }

    if (Object.keys(this.bookLib).length === 0) {
      // Putting these functions up here and below, after the list is created,
      // achieves a 'seamless' refresh and allows for it to update
      // as well in case we clear bookLib
      libraryElement.innerHTML = "";
      showToast('Library is empty.');
      return;
    }

    // We use a docfrag to add elements in a performant way
    const docFrag = new DocumentFragment();
    // Using a special docfrag so favorites will always be first
    // This must be appended first
    const favoriteDocFrag = new DocumentFragment();

    // Iterate over this.bookLib and create list elements
    // Because we have multiple categories, we iterate through them this way
    for (const category in this.bookLib) {

      // NOTE: This could be cut. It might be less intuitive with this in
      // This essentially skips printing a category if it does not have
      // any books inside it.
      if (this.bookLib[category].length === 0)
        continue;

      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = category;

      const listParent = elementFactory('ul');

      this.bookLib[category].forEach(async (book, index) => {
        const state = new State();
        await state.openBook(book.bookData);

        const bookImage = document.createElement('img');
        bookImage.classList.add('library-book-cover');
        bookImage.src = await state.book.coverUrl();
        bookImage.alt = `${state.metadata.title} Book Cover`;
        bookImage.onclick = this.openReaderEvent(index, category);

        const bookLink = document.createElement('a');
        bookLink.classList.add('library-book-title');
        bookLink.textContent = state.metadata.title;
        bookLink.onclick = this.openReaderEvent(index, category);

        const moveCategory = document.createElement('input');
        moveCategory.classList.add('library-book-category-button');
        moveCategory.type = 'button';

        // NOTE: Would be better if converted to object key-value pairs
        switch (category) {
          case 'Library':
            moveCategory.title = 'Move to Favorites';
            moveCategory.value = 'Move to Favorites';
            moveCategory.onclick = this.moveBookToCategory(book);
            break;
          case 'Favorites':
            moveCategory.title = 'Remove from favorites';
            moveCategory.value = 'Remove from favorites';
            moveCategory.onclick = this.moveBookToCategory(book, 'Favorites', 'Library');
            break;
        }

        const removeBook = document.createElement('input');
        removeBook.type = 'button';
        removeBook.title = 'Remove Book';
        removeBook.value = 'Remove Book';
        removeBook.classList.add('library-book-remove-button');

        // Workaround to essentially pass a lot of parameters onto existing
        // functions.
        removeBook.onclick = showModalWrapper(RemoveBook, (_, body, footer, container) => {
          const remove = footer.querySelector('#remove');
          const cancel = footer.querySelector('#cancel');
          const title = body.querySelector('#modal-book-title');

          title.textContent = state.metadata.title;

          cancel.onclick = () => {
            container.remove();
          }
          remove.onclick = () => {

            // removeBookFromLib was supposed to be the original function to be used
            // onclick. However, due to the addition of a modal wrapper,
            // we have to immediately execute the function returned from this function.
            // This preserves the functionality while adding the modal.
            this.removeBookFromLib(index, category)();

            container.remove();
          }
        });

        const bookElement = elementFactory('a', {
        }, bookLink);

        const divParent = elementFactory('div', {
          class: 'library-book',
        }, bookElement, bookImage, moveCategory, removeBook);

        const listChild = elementFactory('li', {},
        divParent);

        listParent.appendChild(listChild);
      });

      if (category !== 'Favorites') {
        docFrag.append(categoryTitle);
        docFrag.append(listParent);
      } else {
        favoriteDocFrag.append(categoryTitle);
        favoriteDocFrag.append(listParent);
      }
    }

    // Clear element before appending
    // It's put here so that it appears to change instantly
    libraryElement.innerHTML = "";
    libraryElement.appendChild(favoriteDocFrag);
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
   * Attached to a button to remove the book passed as a parameter
   * @param {Number} Index The book's index in storage. You can get this in the refreshLibraryDisplay method.
   * @param {String} category Name of the category, like 'Favorites', 'Library'
   */
  removeBookFromLib(index, category) {
    return async () => {
      this.bookLib[category].splice(index, 1);
      showToast('Book removed from Library.');
      await this.saveLibrary();
      this.refreshLibraryDisplay();
    }
  }

  /**
   * Stores the index of the clicked book in localstorage,
   * then goes to the 'reader.html' which opens the book in the
   * stored index. Use this as the event on click for the library
   * items.
   * @param {Number} storageIndex Index of book to be opened in the 'Library' key in localstorage/IndexedDB
   */
  openReaderEvent(storageIndex, category) {
    // We return a function here as a workaround to pass parameters
    return () => {
      try {
        localStorage.setItem('OpenedBookLibIndex', storageIndex);
        localStorage.setItem('OpenedBookLibCategory', category);
        // TODO: Change this from the 'js/' dir to... somewhere else
        window.location.href = "/reader";
      } catch (err) {
        console.log(`ERROR: ${err}`);
      }
    }
  }

  /** Use with a button attached to the bookLib elements */
  moveBookToCategory(book, oldCategory = "Library", newCategory = "Favorites") {
    return async () => {
      this.bookLib[oldCategory].splice(this.bookLib[oldCategory].indexOf(book), 1);

      if (!this.bookLib[newCategory])
        this.bookLib[newCategory] = [];

      this.bookLib[newCategory].push(book);
      showToast(`Book moved to ${newCategory}.`);
      this.refreshLibraryDisplay();
      await this.saveLibrary();
    }
  }
}
