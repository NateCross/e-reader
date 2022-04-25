const chai = window.chai;
const assert = chai.assert;
const expect = chai.expect;

describe('Load Moby Dick', function() {
  it('should load Moby Dick', async function() {
    const state = new State(ePub);
    await state.openBook("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
    assert.isNotNull(state.metadata);
  });
});