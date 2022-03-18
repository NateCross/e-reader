const chai = window.chai;
const expect = chai.expect;

describe('sumTwoNumbers', () => {
  it('Add 1 and 2 to get 3', () => {
    expect(sumTwoNumbers(1, 2)).to.equal(3);
  });
});
