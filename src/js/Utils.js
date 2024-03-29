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

//https://gomakethings.com/debouncing-your-javascript-events/
/**
 * Debounce functions for better performance
 * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Function} fn The function to debounce
 */
export var debounce = function (fn) {

	// Setup a timer
	var timeout;

	// Return a function to run debounced
	return function () {

		// Setup the arguments
		var context = this;
		var args = arguments;

		// If there's a timer, cancel it
		if (timeout) {
			window.cancelAnimationFrame(timeout);
		}

		// Setup the new requestAnimationFrame()
		timeout = window.requestAnimationFrame(function () {
			fn.apply(context, args);
		});

	}

};

/**
 * Automatically attaches events to modal elements
 * @param {String} containerElementId A string of the id of the modal container
 * @param {String} closeButtonClass A string of the class of the modal close button
 */
export function initializeModals(containerElementId = 'modal-container', closeButtonClass = 'modal-close') {
  const modal = document.querySelector(`#${containerElementId}`);
  const close = document.querySelector(`.${closeButtonClass}`);

  close.onclick = () => {
    modal.style.display = 'none';
  }

  window.onclick = e => {
    if (e.target === modal)
      modal.style.display = 'none';
  }
}

/**
 * Adds content to modal and attaches it to event
 * @param {String, String, String} header, content, footer Text in the modal
 * @param {String} containerElementId Used for query selection
 * @param {Function} callback Callback to be executed after modal is displayed
 */
export function attachModal(
  {header, content, footer},
  containerElementId = 'modal-container',
  callback = function() { return }
) {
  return () => {
    const modal = document.querySelector(`#${containerElementId}`);

    const modalHeader = modal.querySelector('.modal-header');

    const modalContent = modal.querySelector('.modal-body');

    const modalFooter = modal.querySelector('.modal-footer');

    modalHeader.children[1].innerHTML = header;
    modalContent.innerHTML = content;
    modalFooter.innerHTML = footer;

    modal.style.display = 'block';

    callback(modalHeader.children[1], modalContent, modalFooter);

  }
}

const toast = Toastify({
  text: "",
  duration: 1500,
  close: true,
  gravity: "top",
  position: "center",
  style: {
    background: "var(--main-color)",
    color: "white",
    "font-family": "Arial, sans-serif",
  },
});

const quickToast = Toastify({
  text: "",
  duration: 1000,
  close: true,
  gravity: "top",
  position: "center",
  style: {
    background: "var(--main-color)",
    color: "white",
    "font-family": "Arial, sans-serif",
  },
});

const warningToast = Toastify({
  text: "",
  duration: 3000,
  close: true,
  gravity: "top",
  position: "center",
  style: {
    background: "#F02C2C",
    color: "white",
    "font-family": "Arial, sans-serif",
  },
});


/**
 * Helper function to show preset toasts with the help of Toastify
 * @param {String} message The message to be displayed in the toast.
 * @param {String} type 'normal', 'warning'
 */
export function showToast (message, type = 'normal') {
  const toastList = {
    normal: toast,
    warning: warningToast,
    quick: quickToast,
  }
  toastList[type].options.text = message;
  toastList[type].showToast();
}

// https://github.com/brunocechet/Fuse.js-with-highlight/blob/master/index.js
/**
 * Helper function to highlight fuse.js results.
 */
export function fuseSearchHighlight(resultItem, highlightClassId = 'library-search-highlight') {
  resultItem.matches.forEach((matchItem) => {

    // Because we search in 'metadata.title and .author'
    // we have to access the resultItem.item like a 2D array
    // thus, we have to split to get the actual metadata
    // category that was found
    const keySplit = matchItem.key.split('.');

    const text = resultItem.item[keySplit[0]][keySplit[1]];
    const result = [];
    const matches = [].concat(matchItem.indices); // limpar referencia
    let pair = matches.shift();

    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i)
      if (pair && i == pair[0]) {
        result.push(`<mark class=${highlightClassId}>`)
      }
      result.push(char)
      if (pair && i == pair[1]) {
        result.push('</mark>')
        pair = matches.shift()
      }
    }
    resultItem.item[keySplit[0]][keySplit[1]] = result.join('');

    if(resultItem.children && resultItem.children.length > 0){
      resultItem.children.forEach((child) => {
        highlighter(child);
      });
    }
  });
}
