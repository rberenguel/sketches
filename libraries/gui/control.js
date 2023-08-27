// Ruben Berenguel, 2020/05

import { $ } from './dom.js'

export { Control }


/**
    A Control is a set of several keys that alter in some way a variable. The
    main difference with a Command is that a Control always affects a variable
    and there can be multiple keys tied to it.

    It expects a list of keys, a task description text and the Variable it affects.

    Note that a control could have no key, just for informational purposes
    */

class Control {
  constructor(keys, task, variable) {
    this.keys = keys
    this.task = task
    this.variable = variable
    if (task === undefined)
      throw new Error("Controls need task defined")

    if (variable === undefined)
      throw new Error("Controls needs variable defined")

  }

  format() {
    let command = $.cel("tr")
    let controls = $.cel("td")
    controls.classList.add("t1")
    let textTD = $.cel("td")
    textTD.classList.add("t2")
    textTD.append($.ctn(`${this.task}`))
    let thingTD = $.cel("td")
    thingTD.classList.add("t3")
    if (this.variable !== undefined) {
      let span = $.cel("span")
      span.style.float = "right"
      try{ 
        span.append(this.variable.span())
      } catch(err){
        if(err instanceof TypeError){
          err.message += `\n\n"You probably forgot to import Float or String from gui"`
        }
        throw err
      }
      thingTD.append(span)
    } else {
      thingTD.append(span)("")
    }
    if (this.keys !== undefined) {
      let controlButtons = this.keys.map(x => x.format())

      if (controlButtons.length == 1) {
        thingTD.onclick = controlButtons[0].onclick
      }
      controls.append(...controlButtons)
    }
    command.append(controls, textTD, thingTD)
    return command
  }
}
