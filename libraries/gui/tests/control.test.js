import { Key, Variable, Control } from "../gui.js";

describe("Control", () => {
  let formatted;
  beforeEach(() => {
    let inner = 42;
    let key = new Key("t", () => {
      inner++;
    });
    let variable = new Variable(() => inner);
    let ctl = new Control([key], "change something", variable);
    formatted = ctl.format();
  });

  it("is a tr", (done) => {
    chai.expect(formatted).to.have.tagName("tr");
    done();
  });

  it("is a tr with a first column", () => {
    chai.expect(formatted).to.contain("td.t1");
  });
  it("is a tr with a first column with the key", () => {
    chai.expect(formatted.querySelector(".t1")).to.have.text("T");
  });

  it("is a tr with a second column", () => {
    chai.expect(formatted).to.contain("td.t2");
  });

  it("is a tr with a second column with the description", () => {
    chai
      .expect(formatted.querySelector(".t2"))
      .to.have.text("change something");
  });

  it("is a tr with a third column", () => {
    chai.expect(formatted).to.contain("td.t3");
  });
  it("is a tr with a third column with the variable", () => {
    chai.expect(formatted.querySelector(".t3")).to.have.text("[42]");
  });
});
