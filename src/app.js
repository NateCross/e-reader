import Library from './Library.js';
import LibItem from './LibItem.js';
import * as Utils from './Utils.js';

///// FUNCTIONS /////

/**
 * @param {ArrayBuffer|String} bookData
 * @param {Array} bookLib The global list of books in library
 */
function storeBookToLib(bookData, bookLib, category) {
  const itemToSave = new LibItem(bookData);
  if (!bookLib[category])
    bookLib[category] = [];

  bookLib[category].push(itemToSave);
  console.log(bookLib);
}

/**
 * Hacky workaround to pass the array of books in the library
 * to the individual book state.
 * Use by executing the function when passed as
 * parameter to an event "openBookEvent()"
 * @param {Library} Library
 * @returns {Function} Event to be used on a file upload trigger
 */
function openBookEvent(Library) {
  return e => {
    if (!window.FileReader) return null;
    if (e.target.files.length === 0) return null;

    const file = e.target.files[0];
    const reader = new FileReader();

    // Executes after readAsArrayBuffer finishes
    reader.onload = bookData => {
      storeBookToLib(bookData.target.result, Library.bookLib, "Library");

      // Need to execute the functions directly after uploading a book
      // Async await does not work here, apparently, so we use 'then'
      // to make these async functions execute one after the other
      Library.saveLibrary().then( () => {
        Library.refreshLibraryDisplay();
      });
    };

    reader.readAsArrayBuffer(file);
  }
}

//// HTML ELEMENTS /////

const $library = document.querySelector('#library');
const $file_upload = document.querySelector('#file-upload');
const $storage_usage = document.querySelector('#usage');
const $storage_quota = document.querySelector('#quota');
const $storage_percent = document.querySelector('#percent');
const $storage_clear = document.querySelector('#clear-storage');

///// MAIN /////
const Lib = new Library($library, $storage_usage, $storage_quota, $storage_percent);

async function clearLibrary() {
  let value = null;

  try {
    value = await localforage.removeItem('Library');
    Lib.bookLib = [];
  } catch(err) {
    console.log(err);
  }

  Lib.refreshLibraryDisplay();

  return value;
}

$file_upload.onchange = openBookEvent(Lib);
$storage_clear.onclick = clearLibrary;

// Load the books from storage and populate the library div
(async () => {
  await Lib.init();
  Lib.refreshLibraryDisplay($library);
})();

console.log('Loaded index');
