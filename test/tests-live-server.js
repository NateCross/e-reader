/*
  global chai:readonly, ePub:readonly localforage:readonly
  State:writable
*/
// Defining global variables so eslint stops nagging me about it

import State from "../modules/State.js";

const assert = chai.assert;
// const expect = chai.expect;

describe('Load Moby Dick', function() {
  this.timeout(5000);
  console.log("Test");

  it('should load metadata', async function() {
    const state = new State(ePub);
    await state.openBook("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
    console.log(state.metadata);
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
