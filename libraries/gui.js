export {GUI, Command, Key, Control, Integer, Float, Boolean, String}

let $ = {
    cel: (s) => document.createElement(s),
    ctn: (s) => document.createTextNode(s),
    byId: (s) => document.getElementById(s)
}

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
            span.onclick = text2.onclick
            variableDisplay = span
        } else
            variableDisplay = ""
        command.append(press, thisKey, toDoThis, variableDisplay)
        return command
    }

    _act() {
        this.key._act()
    }
}

/**
    A Control is a set of several keys that alter in some way a variable. The
    main difference with a Command is that a Control always affects a variable
    and there can be multiple keys tied to it.

    It expects a list of keys, a task description text and the Variable it affects.
*/

class Control {
    constructor(keys, task, variable) {
        this.keys = keys
        this.task = task
        this.variable = variable
    }

    format() {
        let command = $.cel("tr")
        let controls = $.cel("td")
        controls.classList.add("t1")
        let textTD = $.cel("td")
        textTD.classList.add("t2")
        textTD.append($.ctn(` ${this.task}`))
        let thingTD = $.cel("td")
        textTD.classList.add("t3")
        if (this.variable !== undefined) {
            let span = $.cel("span")
            span.style.float = "right"
            span.append(this.variable.span())
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

/**
    A Key description. It is formed of a character and a lambda/method/function
    that does the action. See the examples, since you need to make sure it is a
    proper closure for it to work.
*/
class Key {
    constructor(key, action) {
        this.key = key.toLowerCase()
        this.action = action
    }

    _act() {
        this.action()
        if (this.gui !== undefined) {
            this.gui.update()
        }
    }

    format() {
        let code = $.cel("code")
        let text = $.ctn(this.key.toUpperCase())
        code.appendChild(text)
        code.onclick = () => this._act()
        return code
    }
}

class Variable {
    constructor(variable) {
        this.variable = variable
        this._span = $.cel("span")
        this._addClass("variable")
        this._addClass(this.constructor.name.toLowerCase())
    }

    _addClass(className) {
        if (!this._span.classList.contains(className)) {
            this._span.classList.add(className);
        }
    }

    _removeClass(className) {
        this._span.classList.remove(className)
    }

    format() {
        return `${this.variable()}`
    }

    formatSpan() {
        this._span.innerHTML = ""
        this._span.append(`[${this.format()}]`)
    }

    span() {
        this.formatSpan()
        return this._span
    }
}

class Boolean extends Variable {
    span() {
        this.formatSpan()
        this._removeClass(`${!this.variable()}`)
        this._addClass(`${this.variable()}`)
        return this._span
    }
}

class Integer extends Variable {}

class String extends Variable {}

class Float extends Variable {
    format() {
        return `${this.variable().toPrecision(2)}`
    }
}

class GUI {
    constructor(title, info, subinfo, cmds, states) {
        this.title = title
        this.info = info
        this.subinfo = subinfo
        this.cmds = cmds
        this.dom = $.byId("gui")

        this.states = states
        for (let cmd of this.cmds) {
            cmd.key.gui = this
        }
        for (let state of this.states) {
            let keys = state.keys
            if (keys !== undefined) {
                for (let stateKey of keys) {
                    stateKey.gui = this
                }
            }
        }
        this.swap()
    }

    update() {
        this.dom.innerHTML = ""
        console.log(this)
        let br = $.cel("br")
        let needsHr = true
        if(this.title !== undefined){
            let titleSpan = $.cel("span")
            titleSpan.classList.add("title")
            titleSpan.onclick = () => this.swap()
            titleSpan.innerHTML += this.title
            this.dom.append(titleSpan, $.cel("hr"))
            needsHr = false
        }
        if(this.info !== undefined){
            let infoSpan = $.cel("span")
            infoSpan.onclick = () => this.swap()
            infoSpan.innerHTML += this.info
            needsHr = true
            this.dom.append(infoSpan)
        }
        if(this.subinfo !== undefined){
            let subinfoSpan = $.cel("span")
            subinfoSpan.classList.add("subinfo")
            subinfoSpan.innerHTML += this.subinfo
            this.dom.append(br.cloneNode())
            this.dom.append(subinfoSpan)
        }
        let hr = $.cel("hr")
        if (this.cmds.length > 0 && needsHr) this.dom.append(hr)
        for (let cmd of this.cmds)
            this.dom.append(cmd.format())
        if (this.states.length > 0) this.dom.append(hr.cloneNode())
        let table = $.cel("table")
        table.id = "controls"

        for (let state of this.states) table.append(state.format())
        this.dom.append(table)
    }

    addCmd(cmd) {
        this.cmds.push(cmd)
    }

    swap() {
        let v = this.dom.style.left
        if (v !== "10px") {
            this.dom.style.left = "10px"
            this.dom.style.right = ""

        } else {
            this.dom.style.left = ""
            this.dom.style.right = "10px"
        }
    }

    toggle() {
        let v = this.dom.style.visibility
        if (v == "hidden" || v == "") {
            this.dom.style.visibility = "visible"
        } else {
            this.dom.style.visibility = "hidden"
        }
    }

    dispatch(key) {
        for (let cmd of this.cmds) {
            if (cmd.key.key == key.toLowerCase()) {
                cmd._act()
                this.update()
            }
        }
        for (let state of this.states) {
            let keys = state.keys
            if (keys !== undefined) {
                for (let stateKey of keys) {
                    if (stateKey.key == key.toLowerCase()) {
                        stateKey._act()
                        this.update()
                    }
                }
            }
        }

    }
}
