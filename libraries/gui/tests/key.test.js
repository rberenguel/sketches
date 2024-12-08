import { Key } from "../gui.js";

describe("Key", () => {
  it("formats as a code block", () => {
    let key = new Key("t", () => {});
    let formatted = key.format();
    chai.expect(formatted).to.have.tagName("code");
    chai.expect(formatted).to.have.text("T");
  });
  it("handles click with callback", (done) => {
    let foob = 0;
    let key = new Key("t", () => {
      foob++;
    });
    key.format().click();
    setTimeout(() => {
      chai.expect(foob).to.be.equal(1);
      done();
    });
  });
});
