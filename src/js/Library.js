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
   * @param {Array} searchResults List of books returned from a Fuse.js search
   */
  async refreshLibraryDisplay(libraryElement = this.libraryEl) {
    try {
      await this.refreshStorageDisplay();
    } catch (err) {
      showToast('Unable to refresh storage display.', 'warning');
      console.log(err);
    }

    if (this.bookLib.length === 0) {
      // Putting these functions up here and below, after the list is created,
      // achieves a 'seamless' refresh and allows for it to update
      // as well in case we clear bookLib
      libraryElement.innerHTML = "";
      showToast('Library is empty.');
      return;
    }

    // We use a docfrag to add elements in a performant way
    // This object is meant to store docfrags of different categories
    // depending on what is listed in each book's category
    const docFrags = {};

    this.bookLib.forEach((book, index) => {
      let categoryTitle = null;
      let listParent = null;

      // Creates a new category in docFrags
      // We do this so that categories and books could be added
      // in one go, without having to loop twice or something
      if (!docFrags[book.category]) {
        docFrags[book.category] = new DocumentFragment();

        categoryTitle = document.createElement('h3');
        categoryTitle.textContent = book.category;

        listParent = elementFactory('ul');
      }

      const bookImage = this.createElementBookImage(book, index);
      const bookLink = this.createElementBookLink(book, index);
      const bookAuthor = this.createElementBookAuthor(book, index);
      const moveCategory = this.createElementMoveCategory(book);
      const removeBook = this.createElementRemoveBook(book, index);

      const divBookImageButtonContainer = elementFactory('div', {
        class: 'library-book-image-button-container',
      }, moveCategory, removeBook);

      const divBookImageContainer = elementFactory('div', {
        class: 'library-book-image-container',
      }, bookImage, divBookImageButtonContainer);

      const divParent = elementFactory('div', {
        class: 'library-book',
      }, bookLink, bookAuthor, divBookImageContainer);

      const listChild = elementFactory('li', {},
      divParent);

      if (categoryTitle !== null)
        docFrags[book.category].append(categoryTitle);

      if (listParent !== null)
        docFrags[book.category].append(listParent);

      // The second child is the ul element, so we append the children
      // to this
      docFrags[book.category].children[1].appendChild(listChild);
    });

    // Clear element before appending
    // It's put here so that it appears to change instantly
    libraryElement.innerHTML = "";

    // Because we want to prioritize Favorites in display, we put this first
    if (docFrags['Favorites'])
      libraryElement.appendChild(docFrags['Favorites']);
    if (docFrags['Library'])
      libraryElement.appendChild(docFrags['Library']);
  }

  createElementBookImage(book, index) {
    const bookImage = document.createElement('img');
    bookImage.classList.add('library-book-cover');
    bookImage.src = book.coverImg;
    bookImage.alt = `${book.metadata.title} Book Cover`;
    bookImage.onclick = this.openReaderEvent(index);

    return bookImage;
  }

  createElementBookLink(book, index) {
    const bookLink = document.createElement('a');
    bookLink.classList.add('library-book-title');
    bookLink.textContent = book.metadata.title;
    bookLink.onclick = this.openReaderEvent(index);

    return bookLink;
  }

  createElementBookAuthor(book, index) {
    const bookAuthor = document.createElement('a');
    bookAuthor.classList.add('library-book-author');
    bookAuthor.textContent = book.metadata.creator;
    bookAuthor.onclick = this.openReaderEvent(index);

    return bookAuthor;
  }

  createElementMoveCategory(book) {
    const moveCategory = document.createElement('input');
    moveCategory.classList.add('library-book-category-button');
    moveCategory.type = 'button';

    // NOTE: Would be better if converted to object key-value pairs
    switch (book.category) {
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

    return moveCategory;
  }

  createElementRemoveBook(book, index) {
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

      title.textContent = book.metadata.title;

      cancel.onclick = () => {
        container.remove();
      }
      remove.onclick = () => {

        // removeBookFromLib was supposed to be the original function to be used
        // onclick. However, due to the addition of a modal wrapper,
        // we have to immediately execute the function returned from this function.
        // This preserves the functionality while adding the modal.
        this.removeBookFromLib(index)();

        container.remove();
      }
    });

    return removeBook;
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

  /**
   * Attached to a button to remove the book passed as a parameter
   * @param {Number} Index The book's index in storage. You can get this in the refreshLibraryDisplay method.
   * @param {String} category Name of the category, like 'Favorites', 'Library'
   */
  removeBookFromLib(index) {
    return async () => {
      this.bookLib.splice(index, 1);
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
  openReaderEvent(storageIndex) {
    // We return a function here as a workaround to pass parameters
    return () => {
      try {
        localStorage.setItem('OpenedBookLibIndex', storageIndex);
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

      // this.bookLib[oldCategory].splice(this.bookLib[oldCategory].indexOf(book), 1);
      //
      // if (!this.bookLib[newCategory])
      //   this.bookLib[newCategory] = [];
      //
      // this.bookLib[newCategory].push(book);

      this.bookLib[this.bookLib.indexOf(book)].category = newCategory;

      showToast(`Book moved to ${newCategory}.`);
      this.refreshLibraryDisplay();
      await this.saveLibrary();
    }
  }

  /**
   * Requires fuse.js
   * @param {string} query String to search
   * @param {Object} options Settings and keys to search in the metadata. Likely title.
   */
  searchBooks(
    query,
    options = {
      keys: [ 'metadata.title', 'metadata.creator' ],
      includeMatches: true,
    }) {
    const search = new Fuse(this.bookLib, options);
    return search.search(query);
  }

  updateSearchResults(results, query, $search_results, $search_query) {
    $search_query.innerHTML = `Results for: <strong id='search-query-text'>${query}</strong>`

    if (results.length === 0) {
      $search_results.innerHTML = "";
      showToast('No search results found.');
      return;
    }

    const docFrag = new DocumentFragment();

    results.forEach((result, index) => {
      const book = result.item;

      const bookImage = this.createElementBookImage(book, index);
      const bookLink = this.createElementBookLink(book, index);
      const bookAuthor = this.createElementBookAuthor(book, index);
      // const moveCategory = this.createElementMoveCategory(book);
      // const removeBook = this.createElementRemoveBook(book, index);

      const divParent = elementFactory('div', {
        class: 'library-book',
      }, bookLink, bookAuthor, bookImage);

      const listChild = elementFactory('li', {}, divParent);

      docFrag.appendChild(listChild);
    });
    $search_results.innerHTML = "";
    $search_results.appendChild(docFrag);
  }
}
