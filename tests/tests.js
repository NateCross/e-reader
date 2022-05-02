/*
  global chai:readonly, ePub:readonly localforage:readonly
  State:writable
*/
// Defining global variables so eslint stops nagging me about it

mocha.setup('bdd');
mocha.checkLeaks();

import State from "../src/State.js";

const assert = chai.assert;
// const expect = chai.expect;

describe('epub.js', function() {
  describe('State Manager', function() {
    it('should create a State object', function() {
      const state = new State();
      assert.isObject(state);
    });
  });

  describe('Moby Dick', function() {
    it('should load metadata', async function() {
      const state = new State(ePub);
      await state.openBook("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
      assert.isNotNull(state.metadata);
    });
    it('should load the book\'s cover', async function() {
      const state = new State(ePub);
      await state.openBook("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
      const bookCover = await state.getBookCoverBase64();
      console.log(bookCover);
      assert.strictEqual(bookCover, 'YmxvYjpodHRwOi8vMTI3LjAuMC4xOjgwODAvOGIwMWVhMmEtOTMxYS00ZGI5LTllZjgtZDllMTNiYWE3ZDNi');
    });
    it('saves Moby Dick to bookLib[]', async function() {
      const state = new State(ePub);
      await state.openBook("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
      assert.strictEqual(state.bookLib[0].bookData, "https://s3.amazonaws.com/moby-dick/moby-dick.epub");
    });
    it('saves bookLib[] to localforage', async function() {
      const state = new State(ePub);
      await state.openBook("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
      const lib = await state.getLibrary();
      assert.strictEqual(lib[0].bookData, "https://s3.amazonaws.com/moby-dick/moby-dick.epub");
    });
    it('loads bookLib[] from localforage', async function() {
      const state = new State(ePub);
      await state.init();
      const lib = state.bookLib;
      assert.strictEqual(lib[0].bookData, "https://s3.amazonaws.com/moby-dick/moby-dick.epub");
    });
  });
});

// Used for the 'library' functionality
describe('LocalForage', function() {
  it('should exist and load properly', function() {
    assert.isNotNull(localforage);
  });

  it('should clear all data', async function() {
    await localforage.clear();
    let forageLength = await localforage.length();
    assert.strictEqual(forageLength, 0);
  });
});

// IMPORTANT: Make sure to put this at the end so the tests actually run
mocha.run();
