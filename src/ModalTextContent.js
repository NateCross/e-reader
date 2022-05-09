import { attachModal, initializeModals, elementFactory } from './Utils.js';

/**
 * @param {String} header HTML to be displayed in header
 * @param {String} content HTML to be displayed in body
 * @param {String} footer HTML to be displayed in footer
 * @param {String} containerElementId Used for query selection
 * @param {Function} callback Callback to be executed after modal is displayed. Params: (header, content, footer). These are HTML elements.
 */
export class ModalTextOld {
  constructor(header, content, footer, container = 'modal-container', callback = function() { return }) {
    this.header = header;
    this.content = content;
    this.footer = footer;

    this.modalHeader = document.querySelector('.modal-header');
    this.modalContent = document.querySelector('.modal-body');
    this.modalFooter = document.querySelector('.modal-footer');

    this.container = document.querySelector(`#${container}`);
    // this.modalHeader = document.querySelector('.modal-header');

    this.callback = callback;
  }
  // static initializeModals = initializeModals;
  // static attachModal = attachModal;

  // get headerContentFooterElements() {
  //   console.log(this.container);
  //   // console.log(this.modalHeader);
  //   const modalHeader = document.querySelector('.modal-header');
  //   const modalContent = document.querySelector('.modal-body');
  //   const modalFooter = document.querySelector('.modal-footer');
  //   console.log(modalHeader);
  //   return { modalHeader, modalContent, modalFooter };
  // }

  showModal() {
    // const { header, content, footer } = this.headerContentFooterElements;
    // console.log(header);

    // We get the second child because the first one is the close button
    this.modalHeader.children[1].innerHTML = this.header;
    this.modalContent.innerHTML = this.content;
    this.modalFooter.innerHTML = this.footer;

    this.container.style.display = 'block';  // Shows modal
    this.callback(this.modalHeader, this.modalContent, this.modalFooter);
  }
}

export const LoremIpsum = {
  header: `
    <h1>Lorem Ipsum</h1>
  `,
  content: `
    <h2 id='lorem'>Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet. Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident. Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco ut ea consectetur et est culpa et culpa duis.</h2>
    <br>
    <h3>Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet. Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident. Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco ut ea consectetur et est culpa et culpa duis.</h3>
  `,
  footer: `
    <p>I don't know what to put here so hi</p>
  `
}

// export const ErrorNoBook = new ModalTextOld(
//   `<h2>Error: No Book Selected</h2>`,
//   `
//     <p>
//       A book was not selected, or the selected book was not found.
//       <br>
//       Returning to the Library page in 3 seconds...
//     </p>
//   `,
//   ``,
//
//   'modal-container',
//
//   (header, content, footer) => {
//
//     // Adds the warning class
//     header.classList.add('modal-warning');
//     footer.classList.add('modal-warning');
//
//     const arbitraryWaitTimer = 3000;
//
//     setTimeout(() => {
//       window.location.href = '/';
//     }, arbitraryWaitTimer);
//   }
// );

// Rewriting the modal text class
/**
 * Rewriting the modal text class to not rely on being placed in the DOM
 * @param {String} header HTML to be displayed in the title
 * @param {String} body HTML to be displayed in the body
 * @param {String} footer HTML to be displayed in the footer
 * @param {Function} callback function to be ran after modal is displayed
 * @param {Object} style CSS styles to be applied as a dict
 */
export default class ModalText {
  constructor(header, body, footer, callback = function() { return }, style = {}) {
    this.header = header;
    this.body = body;
    this.footer = footer;
    this.callback = callback;
    this.style = style;

    this.docFrag;
  }

  createModalDocFrag() {
    const docFrag = new DocumentFragment();

    const container = document.createElement('div');
    const content = document.createElement('div');
    const header = document.createElement('div');
    const close = document.createElement('span');
    const headerContent = document.createElement('div');
    const body = document.createElement('div');
    const footer = document.createElement('div');

    container.classList.add('modal');
    container.id = 'modal-container';
    content.classList.add('modal-content');
    header.classList.add('modal-header');
    close.classList.add('modal-close');
    headerContent.classList.add('modal-header-content');
    body.classList.add('modal-body');
    footer.classList.add('modal-footer');

    // Shows the 'x' button
    close.innerHTML = '&times;';

    headerContent.innerHTML = this.header;
    body.innerHTML = this.body;
    footer.innerHTML = this.footer;

    if (this.style.header)
      header.classList.add(this.style.header);
    if (this.style.body)
      body.classList.add(this.style.body);
    if (this.style.footer)
      footer.classList.add(this.style.footer);

    header.appendChild(close);
    header.appendChild(headerContent);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);

    container.appendChild(content);
    docFrag.appendChild(container);

    this.docFrag = docFrag;
    return { docFrag, container, header, body, footer, close };
  }

  showModal(callback = this.callback) {
    const { docFrag, container, header, body, footer, close } = this.createModalDocFrag();

    // This timeout allows the CSS animation to trigger
    // without noticeably affecting anything else
    setTimeout(() => {
      document.body.appendChild(docFrag);
    }, 1)

    // document.body.appendChild(docFrag);
    // container.style.display = 'block';

    this.attachEvents(container, close);
    callback(header, body, footer, container);
  }

  attachEvents(container, close) {
    function removeModal(e) {
      if (e.target === container || e.target === close) {
        container.remove();
        document.removeEventListener('click', removeModal);
      }
    }

    document.addEventListener("click", removeModal);
  }
}

export const ErrorNoBook = new ModalText(
  `<h2>Error: No Book Selected</h2>`,
  `
    <p>
      A book was not selected, or the selected book was not found.
      <br>
      Returning to the Library page in 3 seconds...
    </p>
  `,
  `<input type='button' class='modal-button' title='Click to return now' value='Click to return now'></input>`,
  (_, __, footer) => {
    const arbitraryWaitTimer = 3000;

    setTimeout(() => {
      window.location.href = '/';
    }, arbitraryWaitTimer);

    const button = footer.querySelector('.modal-button');
    button.onclick = () => {
      window.location.href = '/';
    }
  },
  {
    header: 'modal-warning',
    footer: 'modal-warning',
  },
)

export const Metadata = new ModalText(
  `<h2 id='metadata-title'>Metadata</h2>`,
  `
    <ul class='metadata-container'>
      <img id='metadata-cover' alt='Book Cover' height=20% width=20%></li>
      <li id='metadata-author'></li>
      <li id='metadata-description'></li>
      <li id='metadata-pubdate'></li>
      <li id='metadata-publisher'></li>
      <li id='metadata-rights'></li>
    </ul>
  `,
  `<h3 id='metadata-identifier'></h3>`
)

/**
 * A wrapper for use with events
 * @param {ModalText} modal The modal, probably from ModalTextContent
 * @param {function} callback Callback function to be executed after modal displays, takes parameters (header, content, footer)
 */
export function showModalWrapper(modal, callback = undefined) {
  return () => {
    modal.showModal(callback);
  }
}

export const RemoveAllHighlights = new ModalText(
  `<h2>Remove All Highlights?</h2>`,
  `<p>
    Do you wish to remove all highlights?
    <br>
    This cannot be undone.
  </p>
  `,
  `<input type='button' class='modal-button modal-button-remove' id='remove' value='🗑 Remove' title='Remove All Highlights'></input>
  <input type='button' class='modal-button modal-button-cancel' value='🗙 Cancel' title='Cancel' id='cancel'></input
  `,
  undefined,
  {
    header: 'modal-warning',
    footer: 'modal-warning',
  }
)

export const RemoveAllBookmarks = new ModalText(
  `<h2>Remove All Bookmarks?</h2>`,
  `<p>
    Do you wish to remove all bookmarks?
    <br>
    This cannot be undone.
  </p>
  `,
  `<input type='button' class='modal-button modal-button-remove' id='remove' value='🗑 Remove' title='Remove All Bookmarks'></input>
  <input type='button' class='modal-button modal-button-cancel' value='🗙 Cancel' title='Cancel' id='cancel'></input
  `,
  undefined,
  {
    header: 'modal-warning',
    footer: 'modal-warning',
  }
)

export const ResetSettings = new ModalText(
  `<h2>Reset Settings to Default?</h2>`,
  `<p>
    Do you wish to reset all settings to default?
    <br>
    This cannot be undone.
  </p>
  `,
  `<input type='button' class='modal-button modal-button-remove' id='remove' value='↺ Reset' title='Reset settings to default'></input>
  <input type='button' class='modal-button modal-button-cancel' value='🗙 Cancel' title='Cancel' id='cancel'></input
  `,
  undefined,
  {
    header: 'modal-warning',
    footer: 'modal-warning',
  }
)

export const ClearLibrary = new ModalText(
  `<h2>Remove all books?</h2>`,
  `<p>
    Do you wish to remove all books in all categories?
    <br>
    This cannot be undone, but your progress in each book will remain after removal.
  </p>
  `,
  `<input type='button' class='modal-button modal-button-remove' id='remove' value='🗑 Remove All Books' title='Remove all books in all categories'></input>
  <input type='button' class='modal-button modal-button-cancel' value='🗙 Cancel' title='Cancel' id='cancel'></input
  `,
  undefined,
  {
    header: 'modal-warning',
    footer: 'modal-warning',
  }
)

export const RemoveBook = new ModalText(
  `<h2>Remove Book?</h2>`,
  `<p>
    Do you wish to remove <strong id="modal-book-title">this book</strong>?
    <br>
    This cannot be undone, but your progress in this book will remain after removal.
  </p>
  `,
  `<input type='button' class='modal-button modal-button-remove' id='remove' value='🗑 Remove Book' title='Remove book'></input>
  <input type='button' class='modal-button modal-button-cancel' value='🗙 Cancel' title='Cancel' id='cancel'></input
  `,
  undefined,
  {
    header: 'modal-warning',
    footer: 'modal-warning',
  }
)


