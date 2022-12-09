import Library from './Library.js';
import LibItem from './LibItem.js';
import { showToast, fuseSearchHighlight } from './Utils.js';
import * as Modals from './ModalTextContent.js';

///// HTML ELEMENTS /////

const $library = document.querySelector('#library');
const $file_upload = document.querySelector('#file-upload');
const $file_upload_container = document.querySelector('.file-upload-container');
const $file_upload_read_toggle = document.querySelector('#file-upload-read-toggle');

const $storage_usage = document.querySelector('#usage');
const $storage_quota = document.querySelector('#quota');
const $storage_percent = document.querySelector('#percent');
const $storage_clear = document.querySelector('#clear-storage');

const $search = document.querySelector('.search-lib');
const $search_bar = document.querySelector('#search-bar');
const $search_clear = document.querySelector('#search-clear');
const $search_results = document.querySelector('#search-results');
const $search_query = document.querySelector('#search-query');

///// MAIN /////

const Lib = new Library($library, $storage_usage, $storage_quota, $storage_percent);

$file_upload.onchange = openBookEvent();
$search_bar.oninput = searchInLib;
$search_clear.onclick = clearSearch;
$storage_clear.onclick = Modals.showModalWrapper(Modals.ClearLibrary, ModalClearLibraryWrapper);
initDragAndDrop();

// Load the books from storage and populate the library div
(async () => {
  try {
    await Lib.init();
    Lib.refreshLibraryDisplay($library);
    // showToast('Loaded Library.');
  } catch(err) {
    console.log(err);
  }
})();

///// FUNCTIONS /////

/**
 * @param {ArrayBuffer|String} bookData
 * @param {Array} bookLib The global list of books in library
 * @param {String} category The inserted book's category ('Library', 'Favorites', etc.)
 * @param {Object} metadata The opened book's metadata
 * @param {string} coverString base64 string of the book's cover
 */
function storeBookToLib(bookData, bookLib, category, metadata, coverString) {
  const itemToSave = new LibItem(bookData, metadata, coverString, category);

  bookLib.push(itemToSave);
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
  reader.onload = async bookData => {
    let book;
    let metadata;
    let coverUrl;
    try {
      book = ePub({ replacements: 'base64' });
      await book.open(bookData.target.result, 'base64');
      metadata = book.packaging.metadata;
      coverUrl = await book.coverUrl();
    } catch(err) {
      console.log(err);
    }

    // We use an HTTP request to get the image from the url,
    // then we can load the response into the File Reader to get
    // a base64 string of the image file that can be saved
    const xhr = new XMLHttpRequest();
    xhr.open("GET", coverUrl, true);
    xhr.responseType = "blob";
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;

      if (((xhr.status === 200) || (xhr.status == 0)) && (xhr.response)) {
        const ImgReader = new FileReader();
        ImgReader.onloadend = function() {
          storeBookToLib(bookData.target.result, Lib.bookLib, "Library", metadata, ImgReader.result);

          // Need to execute the functions directly after uploading a book
          // Async await does not work here, apparently, so we use 'then'
          // to make these async functions execute one after the other
          Lib.saveLibrary().then(() => {
            if ($file_upload_read_toggle?.checked)
              Lib.openReaderEvent(Lib.bookLib.length - 1)();
            else {
              Lib.refreshLibraryDisplay();
              showToast('Added new EPUB to Library.');
            }
          });
        }
        ImgReader.readAsDataURL(xhr.response);
        }
    }
    xhr.send(null);
  };

  reader.readAsArrayBuffer(file);
}

function searchInLib(e) {
  const query = e.target.value;

  if (query === '') {
    $library.style.display = 'block';
    $search_results.style.display = 'none';
    $search_query.style.display = 'none';
    return;
  }
  $library.style.display = 'none';
  $search_results.style.display = 'block';
  $search_query.style.display = 'block';

  const results = Lib.searchBooks(query);
  results.forEach(resultItem => {
    fuseSearchHighlight(resultItem);
  });
  Lib.updateSearchResults(results, query, $search_results, $search_query);
}

function clearSearch() {
  $search_bar.value = '';

  // Faking 'e.target.value' because, apparently, using the || operator
  // will not pick between 'e.target.value' or 'e'
  // This passes exactly what we need to clear the search.
  searchInLib({ target: { value: '' } });

}

console.log('Loaded index');

