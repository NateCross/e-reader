/*
  global chai:readonly, ePub:readonly localforage:readonly
  State:writable
*/
// Defining global variables so eslint stops nagging me about it

mocha.setup('bdd');
mocha.checkLeaks();

import State from "../modules/State.js";

const assert = chai.assert;
// const expect = chai.expect;

describe('Load Moby Dick', function() {

  it('should load metadata', async function() {
    const state = new State(ePub);
    await state.openBook("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
    assert.isNotNull(state.metadata);
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
