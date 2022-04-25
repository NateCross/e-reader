// Defining these other scripts as a pseudo-require
// so that eslint will stop nagging me about it
const chai = window.chai;
const ePub = window.ePub;
const localForage = window.localforage;

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
    assert.isObject(localForage);
  });

  it('should clear all data', async function() {
    await localForage.clear();
    let forageLength = await localForage.length();
    assert.strictEqual(forageLength, 0);
  });
});
