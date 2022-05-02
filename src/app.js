// import * as ePub from 'epubjs';
// const ePub = require('epubjs');
import State from './State.js';
import Library from './Library.js';
import LibItem from './LibItem.js';
import * as Utils from './Utils.js';

const Lib = new Library();


/// TEST STUFF ///
const storageTest = document.querySelector('.storage-test');
storageTest.addEventListener('change', async e => {
  console.log(e.target.value);
  await localforage.setItem('parameter', e.target.value);
});
/// TEST END ///

console.log('Loaded index');
