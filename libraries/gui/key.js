// Ruben Berenguel, 2020/05

import { $ } from './dom.js'

export { Key }

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