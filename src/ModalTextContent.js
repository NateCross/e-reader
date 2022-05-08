import { attachModal, initializeModals } from './Utils.js';

/**
 * @param {String} header HTML to be displayed in header
 * @param {String} content HTML to be displayed in body
 * @param {String} footer HTML to be displayed in footer
 * @param {String} containerElementId Used for query selection
 * @param {Function} callback Callback to be executed after modal is displayed. Params: (header, content, footer). These are HTML elements.
 */
export class ModalText {
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
  static initializeModals = initializeModals;
  static attachModal = attachModal;

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

export const Metadata = {
  header: `
    <h2 id='metadata-title'>Metadata</h2>
  `,
  content: `
    <ul class='metadata-container'>
      <li id='metadata-author'></li>
      <li id='metadata-description'></li>
      <li id='metadata-pubdate'></li>
      <li id='metadata-publisher'></li>
      <li id='metadata-rights'></li>
    </ul>
  `,
  // Identifier
  footer: `
    <h3 id='metadata-identifier'></h3>
  `
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
  ``,

  'modal-container',

  (header, content, footer) => {

    // Adds the warning class
    header.classList.add('modal-warning');
    footer.classList.add('modal-warning');

    const arbitraryWaitTimer = 3000;

    setTimeout(() => {
      window.location.href = '/';
    }, arbitraryWaitTimer);
  }
);
