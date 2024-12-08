import {
  dateTo19Encoding,
  from19EncodingToDate,
  intTo19Encoding,
  from19EncodingToInt,
  secsTo19x19Encoding,
  from19x19EncodingtoSecs,
  secsToTimeIsh,
} from "../compactTime.js";

describe("to19 and from19 should work", function () {
  it("to19 should divide properly", function () {
    for (let doy = 0; doy < 366; doy++) {
      const v = intTo19Encoding(doy);
      console.log(doy, v.nums);
      const multd = v.nums[0] * 19 + v.nums[1];
      chai.expect(doy).to.eql(multd);
    }
  });

  it("they should be inverses", function () {
    for (let doy = 0; doy < 366; doy++) {
      const v = intTo19Encoding(doy);
      const b = from19EncodingToInt(v.str);
      chai.expect(doy).to.eql(b);
    }
  });
});

describe("secsTo19 should work", function () {
  it("should be smaller than 19x19", function () {
    for (let secs = 0; secs < 86400; secs++) {
      const v = secsTo19x19Encoding(secs);
      chai.expect(v).to.be.below(19 * 19);
    }
  });
  it("should be almost reversible", function () {
    for (let secs = 0; secs < 86400; secs++) {
      const v = secsTo19x19Encoding(secs);
      const b = from19x19EncodingtoSecs(v);
      chai.expect(secs - b).to.be.below(240);
    }
  });
  it("should work for some hand-picked cases", function () {
    let v = secsTo19x19Encoding(19 * 3600 + 26 * 60 + 12);
    let b = from19x19EncodingtoSecs(v);
    let e = secsToTimeIsh(b);
    chai.expect(e).to.be.eql("19:24:00");
    v = secsTo19x19Encoding(23 * 3600 + 59 * 60 + 30);
    b = from19x19EncodingtoSecs(v);
    e = secsToTimeIsh(b);
    chai.expect(e).to.be.eql("23:56:00");
  });
});

describe("dateTo19 and from19ToDate should work with a couple examples", function () {
  it("should encode", function () {
    const now = new Date("Sun, 07 May 2023 18:00:00 GMT");
    const thing = dateTo19Encoding(now);
    chai.expect(thing).to.be.eql("fjstg");
  });
  it("should decode", function () {
    const foo = "fjstg";
    const decoded = from19EncodingToDate(foo);
    chai.expect(decoded).to.be.eql("Sun, 07 May 2023 18:00:00 GMT");
  });
});
