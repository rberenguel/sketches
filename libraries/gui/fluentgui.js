// Ruben Berenguel, 2020/05

import {
    $
} from './dom.js'

export {
    FluentGUI
}


class FluentGUI {
    constructor() {}
    withTitle(title) {
        this.title = title
        return this
    }
    withInfo(info) {
        this.info = info
        return this
    }
    withSubinfo(subinfo) {
        this.subinfo = subinfo
        return this

    }
    withCommands(cmds) {
        this.cmds = cmds
        for (let cmd of this.cmds) {
            cmd.key.gui = this
        }
        return this

    }
    withControls(states) {
        this.states = states
        for (let state of this.states) {
            let keys = state.keys
            if (keys) {
                for (let stateKey of keys) {
                    stateKey.gui = this
                }
            }
        }
        return this

    }
    withDOM(dom) {
        this.dom = dom
        return this

    }

    _title() {
        if (this.title) {
            let titleSpan = $.cel("span")
            titleSpan.classList.add("title")
            titleSpan.onclick = () => this.swap()
            titleSpan.innerHTML += this.title
            this.dom.append(titleSpan, $.cel("hr"))
            return false
        }
    }

    _info() {
        if (this.info) {
            let infoSpan = $.cel("span")
            infoSpan.onclick = () => this.swap()
            infoSpan.innerHTML += this.info
            this.dom.append(infoSpan)
            return true
        }

    }

    _subinfo() {
        if (this.subinfo) {
            let subinfoSpan = $.cel("span")
            subinfoSpan.classList.add("subinfo")
            subinfoSpan.innerHTML += this.subinfo
            this.dom.append($.cel("br"))
            this.dom.append(subinfoSpan)
            return true
        }
    }

    update() {
        this.dom.innerHTML = ""
        let br = $.cel("br")
        let needsHr = true
        needsHr = this._title()
        needsHr = this._info()
        needsHr = this._subinfo()
        let hr = $.cel("hr")
        if (this.cmds) {
            if (this.cmds.length > 0 && needsHr) this.dom.append(hr)
            for (let cmd of this.cmds)
                this.dom.append(cmd.format())
        }
        let table
        if (this.states) {
            if (this.states.length > 0) this.dom.append(hr.cloneNode())
            table = $.cel("table")
            table.id = "controls"
            for (let state of this.states) table.append(state.format())
            this.dom.append(table)
        }
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
        if (this.cmds) {
            for (let cmd of this.cmds) {
                if (cmd.key.key == key.toLowerCase()) {
                    cmd._act()
                    this.update()
                }
            }
        }
        if (this.states) {
            for (let state of this.states) {
                if (state.keys) {
                    for (let sub of state.keys) {
                        if (sub.key == key.toLowerCase()) {
                            sub._act()
                            this.update()
                            return
                        }
                    }
                }
            }
        }
    }
}