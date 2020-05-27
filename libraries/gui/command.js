// Ruben Berenguel, 2020/05

import { $ } from './dom.js'

export { Command }

/**
    A Command, in general, affects no variables and just modifies some global
    state/does some side effect. The idea is to use them for Save, Clear and
    other "global" changes, not tied to any specific project.

    Expects a Key instance and a textual description of the task. Optionally,
    use `withVariable` to link a variable description to this command. This will
    be shown on the right.
*/
class Command {
    constructor(key, task) {
        if (key === undefined)
            throw new Error("Controls need keys defined")

        if (task === undefined)
            throw new Error("Controls need task defined")


        this.key = key
        this.task = task
    }

    withVariable(variable) {
        this.variable = variable
    }

    format() {
        let command = $.cel("p");
        let press = $.ctn("Press ")
        let thisKey = this.key.format()
        let toDoThis = $.ctn(` to ${this.task}`)
        let variableDisplay
        if (this.variable !== undefined) {
            let span = $.cel("span")
            span.style.float = "right"
            span.append(this.variable.span())
            span.onclick = thisKey.onclick
            variableDisplay = span
        } else
            variableDisplay = ""
        command.append(press, thisKey, toDoThis, variableDisplay)
        command.classList.add("command")
        return command
    }

    _act() {
        this.key._act()
    }
}