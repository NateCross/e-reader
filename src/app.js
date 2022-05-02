// import * as ePub from 'epubjs';
// const ePub = require('epubjs');
import State from './State.js';
import Library from './Library.js';
import LibItem from './LibItem.js';
import * as Utils from './Utils.js';

const $library = document.querySelector('#library');
const $testRender = document.querySelector('#testRender');
const $fileUpload = document.querySelector('#file-upload');

const Lib = new Library($library);

// Load the books from storage and populate the library div
(async () => {
  await Lib.init();
  Lib.refreshLibraryDisplay($library);
})();

const FileUploadState = new State();

$fileUpload.onchange = FileUploadState.openBookEvent(Lib);



// $library.innerHTML = Lib.bookLib;

console.log(Lib);

// "https://s3.amazonaws.com/moby-dick/moby-dick.epub"
// console.log(Utils.openBook("https://s3.amazonaws.com/moby-dick/moby-dick.epub"));


/// TEST STUFF ///
const storageTest = document.querySelector('.storage-test');
storageTest.addEventListener('change', async e => {
  console.log(e.target.value);
  await localforage.setItem('parameter', e.target.value);
});
/// TEST END ///

console.log('Loaded index');
