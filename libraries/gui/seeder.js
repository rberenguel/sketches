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
  Integer
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
    inp.type = "number"
    inp.id = "seedInput"
    let span = $.cel("span")
    span.innerHTML = "<br/>Dismiss by pressing <code>enter</code>"
    span.id = "seedInfo"
    $.byId("seed").append(lab, inp, span)

    /* -------------- */

    let E = new Key("e", () => {
      $.byId("seedInput").value = ""
      $.byId("seed").style.visibility = "visible"
      $.byId("seedInput").focus()
    })
    inp.onkeydown = (t) => this.inputSeed(t, this.gui)
    let enterSeedCommand = new Command(E,
      "manually enter seed")
    let seedShow = new Integer(() => this.seed)
    let X = new Key("x", () => {
      this.seed = (window.performance.now() << 0) % 1000000
      this.gui.mark()
    })
    let seedControl = new Control([X],
      "Random seed", seedShow)
    this.command = enterSeedCommand
    this.control = seedControl
    this.seed = seed = (window.performance.now() << 0) % 1000000
  }

  inputSeed(t, gui) {
    if (t.key.toLowerCase() === 'enter') {
      let num = $.byId("seedInput").valueAsNumber
      if (!isNaN(num)) {
        this.seed = num
        this.gui.mark()
      }
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

  set(val) {
    this.seed = val
    return this.seed
  }
}