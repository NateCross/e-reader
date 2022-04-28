

// import { book } from '../modules/epub.min.mjs';
console.log("Test");
const epub = window.ePub;
// console.log(window.ePub);

// var book = epub("../test/epubs/pg2701.epub");
var book = new epub.Book("https://github.com/IDPF/epub3-samples/releases/download/20170606/childrens-literature.epub");
var rendition = book.renderTo("area", {width: 600, height: 400});
var displayed = rendition.display();

console.log(displayed);
