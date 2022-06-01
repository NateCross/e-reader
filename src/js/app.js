import Library from './Library.js';
import LibItem from './LibItem.js';
import { showToast } from './Utils.js';
import * as Modals from './ModalTextContent.js';

//// HTML ELEMENTS /////

const $library = document.querySelector('#library');
const $file_upload = document.querySelector('#file-upload');
const $file_upload_container = document.querySelector('.file-upload-container');

const $storage_usage = document.querySelector('#usage');
const $storage_quota = document.querySelector('#quota');
const $storage_percent = document.querySelector('#percent');
const $storage_clear = document.querySelector('#clear-storage');

///// MAIN /////

const Lib = new Library($library, $storage_usage, $storage_quota, $storage_percent);

// Load the books from storage and populate the library div
(async () => {
  await Lib.init();
  Lib.refreshLibraryDisplay($library);
  showToast('Loaded Library.');
})();

///// EVENTS /////

$file_upload.onchange = openBookEvent(Lib);
$storage_clear.onclick = Modals.showModalWrapper(Modals.ClearLibrary, ModalClearLibraryWrapper);
initDragAndDrop();

///// FUNCTIONS /////

/**
 * @param {ArrayBuffer|String} bookData
 * @param {Array} bookLib The global list of books in library
 * @param {String} category The inserted book's category ('Library', 'Favorites', etc.)
 */
function storeBookToLib(bookData, bookLib, category) {
  const itemToSave = new LibItem(bookData);
  if (!bookLib[category])
    bookLib[category] = [];

  bookLib[category].push(itemToSave);
}

/**
 * Hacky workaround to pass the array of books in the library
 * to the individual book state.
 * Use by executing the function when passed as
 * parameter to an event "openBookEvent()"
 * @param {Lib} Library
 * @returns {Function} Event to be used on a file upload trigger
 */
function openBookEvent(Library) {
  return e => {
    if (!window.FileReader) {
      showToast('Unable to use the browser\'s File Reader.', 'warning');
      return null;
    }
    if (e.target.files.length === 0) {
      showToast('No files uploaded.', 'warning');
      return null;
    }

    const file = e.target.files[0];
    loadFileAsEpub(file, Library);
  }
}

function ModalClearLibraryWrapper(_, __, footer, container) {
  const remove = footer.querySelector('#remove');
  const cancel = footer.querySelector('#cancel');

  cancel.onclick = () => {
    container.remove();
  }
  remove.onclick = () => {
    clearLibrary();
    container.remove();
  }
}

async function clearLibrary() {
  let value = null;

  try {
    value = await localforage.removeItem('Library');
    Lib.bookLib = [];
  } catch (err) {
    console.log(err);
  }

  Lib.refreshLibraryDisplay();

  showToast('Library cleared.');

  return value;
}

function dropZoneDragOver(e) {
  e.preventDefault();
}

function dropZoneOnDrop(e) {
  e.preventDefault();

  $file_upload_container.classList.remove("file-upload-file-is-hovered");

  if (!e.dataTransfer.items) throw 'No items dropped.';
  if (e.dataTransfer.items.length !== 1) throw 'Please upload one item only.';
  if (e.dataTransfer.items[0].kind !== 'file') throw 'Dropped item was not a file.';
  if (e.dataTransfer.items[0].type !== 'application/epub+zip') throw 'Dropped item was not an epub.';

  const file = e.dataTransfer.items[0].getAsFile();
  loadFileAsEpub(file, Lib);
}

function initDragAndDrop() {
  document.ondragenter = (e => {
    e.preventDefault();

    $file_upload_container.classList.add("file-upload-file-is-hovered");
  });

  // Removes the css class when window enters focus.
  // NOTE: I am relying on the possibility that the user's
  // window is not focused when dragging a file.
  // This is a very performant method to achieve the css change given this.
  window.onfocus = e => {
    $file_upload_container.classList.remove("file-upload-file-is-hovered");
    e.preventDefault();
  }

  $file_upload_container.ondragover = dropZoneDragOver;

  $file_upload_container.ondrop = dropZoneOnDrop;

}

function loadFileAsEpub(file) {
  const reader = new FileReader();

  // Executes after readAsArrayBuffer finishes
  reader.onload = bookData => {
    storeBookToLib(bookData.target.result, Lib.bookLib, "Library");

    // Need to execute the functions directly after uploading a book
    // Async await does not work here, apparently, so we use 'then'
    // to make these async functions execute one after the other
    Lib.saveLibrary().then(() => {
      Lib.refreshLibraryDisplay();
    });
    showToast('Added new EPUB to Library.');
  };

  reader.readAsArrayBuffer(file);
}

console.log('Loaded index');
