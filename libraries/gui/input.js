// Ruben Berenguel, 2020/05

import { $ } from "./dom.js";

export { Input };

class Input {
  constructor(text, type, accept, callback) {
    this.text = text;
    this.type = type;
    this.accept = accept;
    this.callback = callback;
    if (text === undefined) throw new Error("Controls need keys defined");

    if (type === undefined) throw new Error("Input needs task defined");

    if (accept === undefined) throw new Error("Input needs variable defined");

    if (callback === undefined) throw new Error("Input needs variable defined");
  }

  format() {
    let control = $.cel("tr");
    let cell = $.cel("td");
    cell.colSpan = "3";
    let inp = $.cel("input");
    let lab = $.cel("label");
    lab.append($.ctn(this.text));
    inp.type = this.type;
    inp.accept = this.accept;
    inp.addEventListener("change", this.callback, false);
    lab.append(inp);
    cell.append(lab);
    control.append(cell);
    return control;
  }
}
