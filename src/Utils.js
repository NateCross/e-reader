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

