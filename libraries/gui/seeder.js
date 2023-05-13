// Ruben Berenguel 2023/05
import {
  $
} from './dom.js'

import {
  Command
} from './command.js'
import {
  Control
} from './control.js'
import {
  String
} from './variable.js'
import {
  Key
} from './key.js'

export {
  Seeder
}

class Seeder {
  constructor(gui) {
    let lab = $.cel("label")
    lab.for = "seedInput"
    lab.innerHTML = "Enter a custom seed (integer)<br/>"
    let inp = $.cel("input")
    inp.type = "string"
    inp.pattern = "#[0-9a-fA-F]+"
    inp.id = "seedInput"
    let span = $.cel("span")
    span.innerHTML = "<br/>Dismiss by pressing <code>enter</code>"
    span.id = "seedInfo"
    $.byId("seed").append(lab, inp, span)

    /* -------------- */

    let Z = new Key("z", () => {
      $.byId("seedInput").value = ""
      $.byId("seed").style.visibility = "visible"
      $.byId("seedInput").focus()
    }, x => this.parseSeed(x), "seed")
    inp.onkeydown = (t) => this.inputSeed(t, this.gui)
    let enterSeedCommand = new Command(Z,
      "manually enter seed (hex)")
    let seedShow = new String(() => this.hex())
    let X = new Key("x", () => {
      this.seed = (window.performance.now() << 0) % 1000000
      this.gui.mark()
    })
    let seedControl = new Control([X],
      "get new random seed, current", seedShow)
    this.command = enterSeedCommand
    this.control = seedControl
    this.seed = (window.performance.now() << 0) % 1000000
  }

  parseSeed(num) {
    const hexed = parseInt(num, 16)
    if (!isNaN(hexed)) {
      this.seed = hexed
      this.gui.mark()
    }
  }

  inputSeed(t, gui) {
    if (t.key.toLowerCase() === 'enter') {
      let num = $.byId("seedInput").value
      if (num.startsWith("#")) {
        num = num.slice(1, num.length)
      }
      this.parseSeed(num)
      $.byId("seed").style.visibility = "hidden"
      gui.update()
      $.byId("seedInput").value = ""
    }
  }

  setup(gui) {
    this.gui = gui

  }

  get() {
    return this.seed
  }

  hex() {
    return this.seed.toString(16).toUpperCase()
  }

  set(val) {
    this.seed = val
    return this.seed
  }
}