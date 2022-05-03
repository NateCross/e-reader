// https://kyleshevlin.com/how-to-write-your-own-javascript-dom-element-factory
/**
 * Quickly and cleanly creates DOM elements with attributes and children.
 * @param {String} type The DOM element type (ex. 'div')
 * @param {Object} attributes Attributes of the element
 */
export function elementFactory(type, attributes, ...children) {
  const el = document.createElement(type)

  for (const key in attributes) {
    el.setAttribute(key, attributes[key])
  }

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      el.appendChild(child)
    }
  })

  return el
}

/**
 * Opens a book; can be used as a parameter for a FileReader load event
 * or used as-is with a link to a file
 * @param {ArrayBuffer|string}
 */
export async function openBook(e) {
  let promise = null;

  let book = ePub(); // Reset book

  let bookData;

  // Checks if the parameter is a url or an event
  // The latter triggers when openBookEvent is used
  if (e.target)
    bookData = e.target.result;
  else
    bookData = e;

  try {
    promise = await book.open(bookData);
  } catch (err) {
    console.log(`ERROR: ${err}`);
  }

  return promise;
}

/**
 * @param {Object} An opened book from epub.js
 */
export function getMetadata(book) {
  return book.packaging.metadata;
}

/**
 * @param {Object} An opened book from epub.js
 */
export function getBookCoverUrl(book) {
  return book.coverUrl();
}

/**
 * Checks current and total storage used by IndexedDB.
 * Returns an object with the usage, quota, and percentage used.
 * also formats to the proper size units
 * @returns {Object} usage, quota, percentage
 */
export async function getIndexedDBUsage() {
  if (!window.navigator.storage) return null;

  const storage = await window.navigator.storage.estimate();

  const storageObj = {
    usage: formatBytes(storage.usage),
    quota: formatBytes(storage.quota),
    percent: (storage.usage / storage.quota * 100).toFixed(2),
  }

  return storageObj;
}

// https://stackoverflow.com/a/18650828
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
/**
 * Handles array forEach for asynchronous functions.
 * The normal array forEach does not wait for the await to finish
 * before starting the next one. This allows for that functionality to work.
 * @param {Array} array Array to iterate through
 * @param {Function} callback Async function, returns (element, index)
 */
export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
